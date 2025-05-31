/*
  # Chat Room Members RLS Politikalarını Düzeltme

  1. Değişiklikler
    - Mevcut politikaları temizle
    - Yeni, basitleştirilmiş politikalar ekle
    - Üyelik yönetimi için güvenli kurallar tanımla

  2. Güvenlik
    - Kullanıcılar sadece kendi üyeliklerini yönetebilir
    - Herkes üyelikleri görebilir
    - Odalara katılım için basit kurallar
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

-- Yeni basit politikalar ekle
CREATE POLICY "allow_select_all"
ON chat_room_members
FOR SELECT
TO public
USING (true);

CREATE POLICY "allow_insert_own"
ON chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "allow_delete_own"
ON chat_room_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);