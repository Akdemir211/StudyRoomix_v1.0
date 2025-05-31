/*
  # Sohbet Odası Politikalarını Düzeltme

  1. Değişiklikler
    - Tüm mevcut politikaları temizle
    - Basitleştirilmiş yeni politikalar ekle
    - Sonsuz döngü sorununu çöz

  2. Güvenlik
    - Temel erişim kontrolleri
    - Üyelik yönetimi
    - Mesaj erişimi
*/

-- Mevcut politikaları temizle
DO $$ 
BEGIN
  -- Chat Room Members politikalarını temizle
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_room_members;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_room_members'
  );
END $$;

-- Chat Room Members için yeni politikalar
CREATE POLICY "allow_view_members"
ON chat_room_members
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_join_room"
ON chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id AND (
      NOT is_private OR
      created_by = auth.uid()
    )
  )
);

CREATE POLICY "allow_leave_room"
ON chat_room_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Chat Messages için politikaları güncelle
DROP POLICY IF EXISTS "messages_select" ON chat_messages;
DROP POLICY IF EXISTS "messages_insert" ON chat_messages;

CREATE POLICY "allow_read_messages"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE room_id = chat_messages.room_id
    AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = chat_messages.room_id
    AND NOT is_private
  )
);

CREATE POLICY "allow_send_messages"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  (
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE room_id = chat_messages.room_id
      AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = chat_messages.room_id
      AND NOT is_private
    )
  )
);

-- Chat Rooms için politikaları güncelle
DROP POLICY IF EXISTS "rooms_select" ON chat_rooms;
DROP POLICY IF EXISTS "rooms_insert" ON chat_rooms;
DROP POLICY IF EXISTS "rooms_update" ON chat_rooms;
DROP POLICY IF EXISTS "rooms_delete" ON chat_rooms;

CREATE POLICY "allow_view_rooms"
ON chat_rooms
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_create_rooms"
ON chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "allow_update_rooms"
ON chat_rooms
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "allow_delete_rooms"
ON chat_rooms
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);