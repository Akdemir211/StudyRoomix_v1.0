/*
  # Çalışma Liderlik Tablosu İyileştirmeleri

  1. Değişiklikler
    - Kullanıcı oluşturma tetikleyicisi ekleme
    - Mevcut kullanıcıları users tablosuna aktarma
    - Foreign key ve politikaları düzenleme

  2. Güvenlik
    - RLS aktif
    - Kullanıcı bazlı erişim kontrolü
*/

-- Önce users tablosuna otomatik kayıt ekleme için fonksiyon ve tetikleyici
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'User'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tetikleyiciyi ekle
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mevcut auth.users kayıtlarını users tablosuna ekle
INSERT INTO public.users (id, name, created_at)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', 'User'),
  created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Liderlik tablosu için foreign key
ALTER TABLE study_leaderboard
DROP CONSTRAINT IF EXISTS study_leaderboard_user_id_fkey,
ADD CONSTRAINT study_leaderboard_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE CASCADE;

-- RLS politikalarını güncelle
ALTER TABLE study_leaderboard ENABLE ROW LEVEL SECURITY;

-- Mevcut politikaları temizle
DO $$ 
BEGIN
  -- Dinamik olarak tüm politikaları temizle
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON study_leaderboard;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'study_leaderboard'
  );
END $$;

-- Yeni politikalar ekle
CREATE POLICY "view_leaderboard"
ON study_leaderboard
FOR SELECT
TO public
USING (true);

CREATE POLICY "insert_own_entry"
ON study_leaderboard
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_stats"
ON study_leaderboard
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);