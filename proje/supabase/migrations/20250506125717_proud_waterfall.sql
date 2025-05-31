/*
  # Sohbet Sistemi Güvenlik Politikaları Güncellemesi

  1. Değişiklikler
    - Chat Room Members için yeni politikalar
    - Mesaj erişimi için güvenlik kuralları
    - Realtime özelliği için gerekli ayarlar

  2. Güvenlik
    - Üyelik sistemi için net kurallar
    - Mesaj erişimi için doğru kontroller
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
CREATE POLICY "members_select"
ON chat_room_members
FOR SELECT
TO public
USING (true);

CREATE POLICY "members_insert"
ON chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "members_delete"
ON chat_room_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Chat Messages için politikaları güncelle
DROP POLICY IF EXISTS "messages_select" ON chat_messages;
DROP POLICY IF EXISTS "messages_insert" ON chat_messages;

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
    AND NOT is_private
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
      AND NOT is_private
    )
  )
);