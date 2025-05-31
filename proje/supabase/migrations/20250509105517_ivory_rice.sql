/*
  # Sohbet Mesajları için RLS Politikalarını Düzeltme

  1. Değişiklikler
    - Mesaj gönderme politikasını güncelleme
    - Mesaj okuma politikasını güncelleme
    - Mesaj silme politikasını koruma
    
  2. Güvenlik
    - Kullanıcılar public odalarda mesaj gönderebilir
    - Kullanıcılar üye oldukları özel odalarda mesaj gönderebilir
    - Kullanıcılar kendi mesajlarını silebilir
*/

-- Önce RLS'yi etkinleştir
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_messages;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_messages'
  );
END $$;

-- Mesaj gönderme politikası
CREATE POLICY "allow_message_insert"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  (
    -- Public odalarda mesaj gönderme
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id
      AND NOT is_private
    )
    OR
    -- Üye olunan özel odalarda mesaj gönderme
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE room_id = chat_messages.room_id
      AND user_id = auth.uid()
    )
    OR
    -- Eğitim Koçum odasında mesaj gönderme (pro kullanıcılar için)
    EXISTS (
      SELECT 1 FROM chat_rooms cr
      JOIN users u ON u.id = auth.uid()
      WHERE cr.id = room_id
      AND cr.name = 'Eğitim Koçum'
      AND u.is_pro = true
      AND cr.created_by = auth.uid()
    )
  )
);

-- Mesaj okuma politikası
CREATE POLICY "allow_message_select"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  -- Public odaların mesajlarını okuma
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id
    AND NOT is_private
  )
  OR
  -- Üye olunan özel odaların mesajlarını okuma
  EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE room_id = chat_messages.room_id
    AND user_id = auth.uid()
  )
  OR
  -- Eğitim Koçum odasının mesajlarını okuma (pro kullanıcılar için)
  EXISTS (
    SELECT 1 FROM chat_rooms cr
    JOIN users u ON u.id = auth.uid()
    WHERE cr.id = room_id
    AND cr.name = 'Eğitim Koçum'
    AND u.is_pro = true
    AND cr.created_by = auth.uid()
  )
);

-- Mesaj silme politikası
CREATE POLICY "allow_message_delete"
ON chat_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);