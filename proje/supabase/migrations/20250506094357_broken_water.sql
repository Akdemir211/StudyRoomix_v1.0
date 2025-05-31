/*
  # Realtime ve RLS Politikaları Güncellemesi

  1. Değişiklikler
    - Realtime özelliği için güvenlik politikaları eklendi
    - Var olan realtime yapılandırması korundu
    - RLS politikaları güncellendi

  2. Güvenlik
    - Gerçek zamanlı erişim için güvenlik kontrolleri
    - Özel odalar için üyelik kontrolü
    - Mesaj erişimi için oda üyeliği kontrolü
*/

-- Realtime politikaları güncelleme
DO $$
BEGIN
  -- Eğer tablo zaten realtime'da değilse ekle
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chat_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'chat_room_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_members;
  END IF;
END $$;

-- RLS politikalarını güncelle
DROP POLICY IF EXISTS "Enable realtime for public rooms" ON chat_rooms;
CREATE POLICY "Enable realtime for public rooms"
  ON chat_rooms
  FOR SELECT
  TO public
  USING (
    NOT is_private OR 
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE room_id = id AND user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Enable realtime for messages" ON chat_messages;
CREATE POLICY "Enable realtime for messages"
  ON chat_messages
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id AND (
        NOT is_private OR
        created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM chat_room_members
          WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
        )
      )
    )
  );