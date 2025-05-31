/*
  # Mesaj Gönderme Politikalarını Düzeltme

  1. Değişiklikler
    - Public odalarda mesaj gönderme politikası düzeltildi
    - Mesaj okuma politikası güncellendi
    - RLS politikaları optimize edildi

  2. Güvenlik
    - Kullanıcılar sadece kendi mesajlarını gönderebilir
    - Public odalarda herkes mesaj gönderebilir
    - Private odalarda sadece üyeler mesaj gönderebilir
*/

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "allow_send_messages" ON chat_messages;
DROP POLICY IF EXISTS "allow_read_messages" ON chat_messages;

-- Mesaj gönderme politikası
CREATE POLICY "allow_send_messages" ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND (
    -- Public odalarda herkes mesaj gönderebilir
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id
      AND NOT is_private
    )
    OR
    -- Private odalarda sadece üyeler mesaj gönderebilir
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE room_id = chat_messages.room_id
      AND user_id = auth.uid()
    )
  )
);

-- Mesaj okuma politikası
CREATE POLICY "allow_read_messages" ON chat_messages
FOR SELECT
TO authenticated
USING (
  -- Public odaların mesajlarını herkes okuyabilir
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id
    AND NOT is_private
  )
  OR
  -- Private odalarda sadece üyeler mesajları okuyabilir
  EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE room_id = chat_messages.room_id
    AND user_id = auth.uid()
  )
);

-- RLS'yi aktif et
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;