/*
  # Eğitim Koçum Odası Politikaları

  1. Değişiklikler
    - Eğitim Koçum odası için özel erişim politikaları
    - Mesaj gönderme politikalarını güncelleme
    - Oda üyeliği kontrollerini güncelleme

  2. Güvenlik
    - Sadece oda sahibi erişebilir
    - Mesaj gönderme yetkisi düzeltildi
*/

-- Eğitim Koçum odası için özel politikalar
DROP POLICY IF EXISTS "education_coach_room_access" ON chat_rooms;
CREATE POLICY "education_coach_room_access"
ON chat_rooms
FOR ALL
TO authenticated
USING (
  (name = 'Eğitim Koçum' AND created_by = auth.uid()) OR
  (name != 'Eğitim Koçum')
);

-- Mesaj gönderme politikasını güncelle
DROP POLICY IF EXISTS "allow_send_messages" ON chat_messages;
CREATE POLICY "allow_send_messages"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  (
    -- Eğitim Koçum odası için özel kontrol
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id
      AND name = 'Eğitim Koçum'
      AND created_by = auth.uid()
    )
    OR
    -- Diğer odalar için normal kontrol
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id
      AND name != 'Eğitim Koçum'
      AND (
        NOT is_private OR
        EXISTS (
          SELECT 1 FROM chat_room_members
          WHERE room_id = chat_messages.room_id
          AND user_id = auth.uid()
        )
      )
    )
  )
);

-- Mesaj okuma politikasını güncelle
DROP POLICY IF EXISTS "allow_read_messages" ON chat_messages;
CREATE POLICY "allow_read_messages"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  -- Eğitim Koçum odası için özel kontrol
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id
    AND name = 'Eğitim Koçum'
    AND created_by = auth.uid()
  )
  OR
  -- Diğer odalar için normal kontrol
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id
    AND name != 'Eğitim Koçum'
    AND (
      NOT is_private OR
      EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_messages.room_id
        AND user_id = auth.uid()
      )
    )
  )
);