/*
  # Şifreli Oda Katılım Politikaları

  1. Değişiklikler
    - Mevcut üyelik politikalarını temizle
    - Şifreli odalar için yeni politikalar ekle
    - Üyelik yönetimi için güvenlik kuralları güncelle

  2. Güvenlik
    - Kullanıcılar sadece kendi üyeliklerini yönetebilir
    - Şifreli odalara katılım için özel kontroller
    - Genel odalara serbest katılım
*/

-- Mevcut politikaları temizle
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_room_members;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_room_members'
  );
END $$;

-- Üyelikleri görüntüleme politikası
CREATE POLICY "allow_view_members"
ON chat_room_members
FOR SELECT
TO authenticated
USING (true);

-- Odaya katılma politikası
CREATE POLICY "allow_join_room"
ON chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Kullanıcı sadece kendi adına üyelik ekleyebilir
  auth.uid() = user_id
  AND
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id
    AND (
      NOT is_private  -- Genel odalar
      OR 
      created_by = auth.uid()  -- Oda sahibi
      OR 
      (is_private = true AND password_hash IS NOT NULL)  -- Şifreli odalar
    )
  )
);

-- Odadan ayrılma politikası
CREATE POLICY "allow_leave_room"
ON chat_room_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Mesaj gönderme politikalarını güncelle
DROP POLICY IF EXISTS "allow_send_messages" ON chat_messages;
CREATE POLICY "allow_send_messages"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND
  EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE room_id = chat_messages.room_id
    AND user_id = auth.uid()
  )
);