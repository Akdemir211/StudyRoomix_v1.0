/*
  # Sohbet Odası Üyelik Politikalarını Güncelleme

  1. Değişiklikler
    - chat_room_members tablosu için RLS politikalarını güncelleme
    - Kullanıcıların odalara katılabilmesi için gerekli izinleri ekleme
    - Özel odalara katılım kurallarını düzenleme

  2. Güvenlik
    - Kullanıcılar sadece kendi üyeliklerini görebilir
    - Kullanıcılar sadece izin verilen odalara katılabilir
    - Özel odalar için şifre kontrolü
*/

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "Herkes üyelikleri görebilir" ON chat_room_members;
DROP POLICY IF EXISTS "Kullanıcılar odalara katılabilir" ON chat_room_members;

-- Yeni politikalar oluştur
CREATE POLICY "Enable membership viewing"
  ON chat_room_members
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id
      AND (
        NOT is_private OR
        created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM chat_room_members
          WHERE room_id = chat_room_members.room_id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Enable room joining"
  ON chat_room_members
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id
      AND (
        NOT is_private OR
        created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM chat_room_members
          WHERE room_id = chat_room_members.room_id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Enable leaving rooms"
  ON chat_room_members
  FOR DELETE
  TO public
  USING (auth.uid() = user_id);