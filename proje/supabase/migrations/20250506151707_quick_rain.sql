/*
  # Study Leaderboard Düzeltmeleri

  1. Değişiklikler
    - study_leaderboard tablosunu yeniden oluşturma
    - Doğru foreign key ilişkilerini kurma
    - Sıralama trigger'ını optimize etme
    
  2. Güvenlik
    - RLS politikalarını düzenleme
    - Kullanıcı erişim kontrollerini güncelleme
*/

-- Önce mevcut trigger'ı kaldır
DROP TRIGGER IF EXISTS update_study_ranks_trigger ON study_leaderboard;
DROP FUNCTION IF EXISTS update_study_ranks();

-- Tabloyu yeniden oluştur
DROP TABLE IF EXISTS study_leaderboard;
CREATE TABLE study_leaderboard (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_duration integer NOT NULL DEFAULT 0,
  rank integer,
  updated_at timestamptz DEFAULT now()
);

-- Sıralama güncelleme fonksiyonu
CREATE OR REPLACE FUNCTION update_study_ranks()
RETURNS trigger AS $$
BEGIN
  -- Sıralama güncelleme
  WITH ranked_users AS (
    SELECT 
      user_id,
      RANK() OVER (ORDER BY total_duration DESC) as new_rank
    FROM study_leaderboard
  )
  UPDATE study_leaderboard sl
  SET rank = ru.new_rank
  FROM ranked_users ru
  WHERE sl.user_id = ru.user_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Yeni trigger oluştur
CREATE TRIGGER update_study_ranks_trigger
AFTER INSERT OR UPDATE OF total_duration ON study_leaderboard
FOR EACH ROW
EXECUTE FUNCTION update_study_ranks();

-- RLS politikaları
ALTER TABLE study_leaderboard ENABLE ROW LEVEL SECURITY;

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

-- Realtime özelliğini etkinleştir
ALTER PUBLICATION supabase_realtime ADD TABLE study_leaderboard;