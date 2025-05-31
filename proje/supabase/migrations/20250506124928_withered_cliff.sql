/*
  # Chat Room Members Politikalarını Düzeltme

  1. Değişiklikler
    - Mevcut politikaları temizle
    - Basit ve net politikalar ekle
    - Döngüsel bağımlılıkları kaldır

  2. Güvenlik
    - Temel CRUD işlemleri için politikalar
    - Kullanıcı bazlı erişim kontrolü
*/

-- Mevcut politikaları temizle
DO $$ 
BEGIN
  -- Mevcut politikaları dinamik olarak temizle
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_room_members;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_room_members'
  );
END $$;

-- Temel okuma politikası
CREATE POLICY "allow_view_members"
ON chat_room_members
FOR SELECT
TO public
USING (true);

-- Temel ekleme politikası
CREATE POLICY "allow_join_rooms"
ON chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Temel silme politikası
CREATE POLICY "allow_leave_rooms"
ON chat_room_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- RLS'yi aktif et
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;