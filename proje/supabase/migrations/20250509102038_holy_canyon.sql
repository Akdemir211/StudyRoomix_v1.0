/*
  # Sohbet Mesajları için RLS Politikalarını Düzeltme

  1. Değişiklikler
    - Mesaj gönderme politikasını güncelleme
    - Public odalarda mesaj göndermeyi etkinleştirme
    - Üye olunan odalarda mesaj göndermeyi etkinleştirme

  2. Güvenlik
    - Kullanıcılar public odalarda mesaj gönderebilir
    - Kullanıcılar üye oldukları özel odalarda mesaj gönderebilir
*/

-- Önce RLS'yi etkinleştir
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Users can insert messages in their rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their rooms" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON chat_messages;

-- Mesaj gönderme politikası
CREATE POLICY "chat_messages_insert"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND (
    -- Public odalarda mesaj gönderme
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id
      AND NOT is_private
    )
    OR
    -- Üye olunan odalarda mesaj gönderme
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE room_id = chat_messages.room_id
      AND user_id = auth.uid()
    )
  )
);

-- Mesaj görüntüleme politikası
CREATE POLICY "chat_messages_select"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id
    AND NOT is_private
  )
  OR
  EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE room_id = chat_messages.room_id
    AND user_id = auth.uid()
  )
);

-- Mesaj silme politikası
CREATE POLICY "chat_messages_delete"
ON chat_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);