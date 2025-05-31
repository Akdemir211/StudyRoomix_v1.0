/*
  # Sohbet Odası Üyelik Politikalarını Düzeltme

  1. Değişiklikler
    - Mevcut politikaları dinamik olarak temizle
    - Yeni basitleştirilmiş politikalar ekle
    
  2. Güvenlik
    - Tüm kullanıcılar üyelikleri görebilir
    - Sadece oturum açmış kullanıcılar katılabilir
    - Kullanıcılar sadece kendi üyeliklerini silebilir
*/

-- Mevcut politikaları dinamik olarak temizle
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_room_members;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_room_members'
  );
END $$;

-- Yeni basitleştirilmiş politikalar
CREATE POLICY "allow_select_members"
ON chat_room_members
FOR SELECT
TO public
USING (true);

CREATE POLICY "allow_insert_members"
ON chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

CREATE POLICY "allow_delete_members"
ON chat_room_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);