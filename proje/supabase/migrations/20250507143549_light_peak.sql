/*
  # Hesap Ayarları için Veri Tabanı Güncellemesi

  1. Değişiklikler
    - Kullanıcı profil resmi için storage bucket oluşturma
    - Kullanıcı profil resmi için storage politikaları
    - Kullanıcı tablosu için RLS politikaları güncelleme

  2. Güvenlik
    - Kullanıcılar sadece kendi profillerini güncelleyebilir
    - Profil resimleri için güvenli erişim
*/

-- Storage bucket oluştur
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT DO NOTHING;

-- Storage politikaları
CREATE POLICY "Avatar görüntüleme herkese açık"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'avatars' );

CREATE POLICY "Kullanıcılar kendi avatarlarını yükleyebilir"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = 'avatars'
);

CREATE POLICY "Kullanıcılar kendi avatarlarını güncelleyebilir"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND owner = auth.uid()
);

CREATE POLICY "Kullanıcılar kendi avatarlarını silebilir"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND owner = auth.uid()
);

-- Kullanıcı tablosu için RLS politikalarını güncelle
DROP POLICY IF EXISTS "Users can read all profiles" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;

CREATE POLICY "Profilleri görüntüleme"
ON users FOR SELECT
TO public
USING (true);

CREATE POLICY "Profil güncelleme"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);