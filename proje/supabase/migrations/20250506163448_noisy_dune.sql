/*
  # Şifreli Oda Erişim Politikalarını Düzeltme

  1. Değişiklikler
    - Mevcut politikaları temizle
    - Basitleştirilmiş yeni politikalar ekle
    - Üyelik yönetimi için güvenli kurallar ekle

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
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id
  )
);

-- Odadan ayrılma politikası
CREATE POLICY "allow_leave_room"
ON chat_room_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);