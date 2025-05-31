/*
  # Sohbet Sistemini Sıfırlama ve Düzeltme

  1. Değişiklikler
    - Mevcut verileri temizleme
    - Politikaları yeniden düzenleme
    - Varsayılan odaları ekleme
    
  2. Güvenlik
    - RLS politikalarını optimize etme
    - Erişim kontrollerini düzenleme
*/

-- Mevcut tabloları temizle
TRUNCATE chat_messages, chat_room_members, chat_rooms CASCADE;

-- Tüm politikaları temizle
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_rooms;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_rooms'
  );
  
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_messages;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_messages'
  );
  
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_room_members;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_room_members'
  );
END $$;

-- Chat Rooms için yeni politikalar
CREATE POLICY "enable_read_access_for_all_users"
ON chat_rooms
FOR SELECT
TO public
USING (
  (NOT is_private) OR                    -- Genel odalar herkese açık
  (created_by = auth.uid()) OR           -- Oda sahibi görebilir
  (EXISTS (                              -- Üyeler görebilir
    SELECT 1 
    FROM chat_room_members 
    WHERE room_id = chat_rooms.id 
    AND user_id = auth.uid()
  ))
);

CREATE POLICY "authenticated_users_can_create_rooms"
ON chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "creators_can_update_own_rooms"
ON chat_rooms
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "creators_can_delete_own_rooms"
ON chat_rooms
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Chat Messages için yeni politikalar
CREATE POLICY "enable_read_access_for_messages"
ON chat_messages
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = chat_messages.room_id
    AND (
      NOT is_private
      OR created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "enable_message_creation"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id
    AND (
      NOT is_private
      OR created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
      )
    )
  )
);

-- Chat Room Members için yeni politikalar
CREATE POLICY "enable_membership_viewing"
ON chat_room_members
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id
    AND (
      NOT is_private
      OR created_by = auth.uid()
      OR room_id IN (
        SELECT room_id FROM chat_room_members
        WHERE user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "enable_joining_public_rooms"
ON chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id
    AND NOT is_private
  )
);

CREATE POLICY "enable_joining_private_rooms"
ON chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id
    AND created_by = auth.uid()
  )
);

CREATE POLICY "enable_leaving_rooms"
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