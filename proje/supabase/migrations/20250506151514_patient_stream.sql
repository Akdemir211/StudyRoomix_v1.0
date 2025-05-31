/*
  # Çalışma Süresi Takip Sistemi

  1. Yeni Tablolar
    - `study_sessions`: Çalışma oturumları
      - `id` (uuid, primary key)
      - `user_id` (uuid): Kullanıcı ID'si
      - `duration` (integer): Saniye cinsinden süre
      - `created_at` (timestamptz): Oturum başlangıç zamanı
      - `ended_at` (timestamptz): Oturum bitiş zamanı
      
    - `study_leaderboard`: Liderlik tablosu
      - `user_id` (uuid): Kullanıcı ID'si
      - `total_duration` (integer): Toplam çalışma süresi
      - `rank` (integer): Sıralama
      - `updated_at` (timestamptz): Son güncelleme zamanı

  2. Güvenlik
    - RLS politikaları aktif
    - Kullanıcılar kendi kayıtlarını oluşturabilir
    - Herkes liderlik tablosunu görebilir
*/

-- Study Sessions tablosu
CREATE TABLE IF NOT EXISTS study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  duration integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

-- Study Leaderboard tablosu
CREATE TABLE IF NOT EXISTS study_leaderboard (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_duration integer NOT NULL DEFAULT 0,
  rank integer,
  updated_at timestamptz DEFAULT now()
);

-- RLS Politikaları
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_leaderboard ENABLE ROW LEVEL SECURITY;

-- Study Sessions için politikalar
CREATE POLICY "Users can create their own sessions"
  ON study_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own sessions"
  ON study_sessions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON study_sessions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Study Leaderboard için politikalar
CREATE POLICY "Everyone can view leaderboard"
  ON study_leaderboard
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update their own leaderboard entry"
  ON study_leaderboard
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rank"
  ON study_leaderboard
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Otomatik sıralama için fonksiyon
CREATE OR REPLACE FUNCTION update_study_ranks()
RETURNS TRIGGER AS $$
BEGIN
  -- Sıralamaları güncelle
  UPDATE study_leaderboard
  SET rank = ranks.rank
  FROM (
    SELECT user_id, RANK() OVER (ORDER BY total_duration DESC) as rank
    FROM study_leaderboard
  ) ranks
  WHERE study_leaderboard.user_id = ranks.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Sıralama için trigger
CREATE TRIGGER update_study_ranks_trigger
AFTER INSERT OR UPDATE ON study_leaderboard
FOR EACH ROW
EXECUTE FUNCTION update_study_ranks();