/*
  # Storage ve Kullanıcı Politikaları Düzeltmesi

  1. Değişiklikler
    - Storage bucket kontrolü
    - Mevcut politikaları temizleme
    - Yeni politikalar ekleme

  2. Güvenlik
    - Kullanıcı profil erişimi
    - Dosya yükleme ve silme izinleri
*/

-- Storage bucket oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- Mevcut storage politikalarını temizle
DO $$ 
BEGIN
  -- Dinamik olarak tüm politikaları temizle
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON storage.objects;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'objects' AND schemaname = 'storage'
  );
END $$;

-- Yeni storage politikaları
CREATE POLICY "avatar_select_policy"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'avatars' );

CREATE POLICY "avatar_insert_policy"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'avatars'
);

CREATE POLICY "avatar_update_policy"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND owner = auth.uid()
);

CREATE POLICY "avatar_delete_policy"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND owner = auth.uid()
);

-- Kullanıcı tablosu için RLS politikalarını güncelle
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "users_select_policy"
ON users FOR SELECT
TO public
USING (true);

CREATE POLICY "users_update_policy"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);