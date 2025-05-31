/*
  # Sohbet Sistemi Politikalarını Optimize Etme

  1. Değişiklikler
    - Tüm mevcut politikaları temizle
    - Optimize edilmiş yeni politikalar ekle
    - Sonsuz döngü sorununu çöz
    - Verileri sıfırla ve varsayılan odaları ekle

  2. Güvenlik
    - RLS aktif kalacak
    - Erişim kontrolü sağlanacak
    - Gereksiz ilişkisel sorgular kaldırılacak
*/

-- Mevcut verileri temizle
TRUNCATE chat_messages, chat_room_members, chat_rooms CASCADE;

-- Tüm politikaları temizle
DO $$ 
BEGIN
  -- Chat Rooms politikalarını temizle
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_rooms;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_rooms'
  );
  
  -- Chat Messages politikalarını temizle
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_messages;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_messages'
  );
  
  -- Chat Room Members politikalarını temizle
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_room_members;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_room_members'
  );
END $$;

-- Chat Rooms için optimize edilmiş politikalar
CREATE POLICY "rooms_select"
ON chat_rooms
FOR SELECT
TO public
USING (true); -- Tüm odalar görünür olsun, erişim kontrolü üyelik üzerinden yapılacak

CREATE POLICY "rooms_insert"
ON chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "rooms_update"
ON chat_rooms
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "rooms_delete"
ON chat_rooms
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Chat Messages için optimize edilmiş politikalar
CREATE POLICY "messages_select"
ON chat_messages
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE room_id = chat_messages.room_id
    AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = chat_messages.room_id
    AND (NOT is_private OR created_by = auth.uid())
  )
);

CREATE POLICY "messages_insert"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE room_id = room_id
      AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id
      AND (NOT is_private OR created_by = auth.uid())
    )
  )
);

-- Chat Room Members için optimize edilmiş politikalar
CREATE POLICY "members_select"
ON chat_room_members
FOR SELECT
TO public
USING (true); -- Üyelikler görünür olsun

CREATE POLICY "members_insert"
ON chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id
    AND (NOT is_private OR created_by = auth.uid())
  )
);

CREATE POLICY "members_delete"
ON chat_room_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Varsayılan odaları ekle
INSERT INTO chat_rooms (name, description, is_private, created_at)
VALUES
  ('Matematik', 'Matematik problemleri ve çözümleri için tartışma odası', false, now()),
  ('Fizik', 'Fizik konuları ve formüller hakkında sohbet odası', false, now()),
  ('Biyoloji', 'Biyoloji konuları ve güncel bilimsel gelişmeler', false, now()),
  ('Kimya', 'Kimya dersine ait konular ve deneyler hakkında tartışma', false, now()),
  ('Edebiyat', 'Edebiyat, kitaplar ve yazarlar hakkında sohbet', false, now()),
  ('Tarih', 'Tarih konuları ve dönemler hakkında tartışma', false, now())
ON CONFLICT DO NOTHING;