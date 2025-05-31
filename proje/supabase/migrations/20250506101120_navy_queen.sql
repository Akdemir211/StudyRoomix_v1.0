/*
  # Sohbet Odaları Politikalarını Düzeltme

  1. Değişiklikler
    - Mevcut politikaları temizle
    - Yeni, optimize edilmiş politikalar ekle
    - Sonsuz döngü sorununu çöz

  2. Güvenlik
    - RLS aktif kalacak
    - Erişim kontrolü sağlanacak
*/

-- Önce tüm mevcut politikaları temizle
DROP POLICY IF EXISTS "Enable read access for chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON chat_rooms;
DROP POLICY IF EXISTS "Enable update for room creators" ON chat_rooms;
DROP POLICY IF EXISTS "Enable delete for room creators" ON chat_rooms;
DROP POLICY IF EXISTS "Enable public room access" ON chat_rooms;
DROP POLICY IF EXISTS "Enable realtime for public rooms" ON chat_rooms;

-- Yeni basitleştirilmiş politikalar ekle
CREATE POLICY "chat_rooms_select_policy" 
ON chat_rooms 
FOR SELECT 
TO authenticated
USING (
  NOT is_private OR                     -- Genel odalar herkese açık
  created_by = auth.uid() OR           -- Oda sahibi görebilir
  EXISTS (                             -- Üyeler görebilir
    SELECT 1 
    FROM chat_room_members 
    WHERE room_id = id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "chat_rooms_insert_policy"
ON chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "chat_rooms_update_policy"
ON chat_rooms
FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "chat_rooms_delete_policy"
ON chat_rooms
FOR DELETE
TO authenticated
USING (created_by = auth.uid());