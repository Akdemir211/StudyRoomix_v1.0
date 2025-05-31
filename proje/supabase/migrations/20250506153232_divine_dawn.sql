/*
  # Çalışma Oturumları için Gerçek Zamanlı Özellikler

  1. Değişiklikler
    - Realtime özelliğini etkinleştirme
    - Aktif oturumlar için görünüm oluşturma
    - Liderlik tablosu güncellemeleri
    
  2. Güvenlik
    - RLS politikaları
    - Oturum yönetimi
*/

-- Realtime özelliğini etkinleştir
BEGIN;

-- study_sessions tablosunu realtime'a ekle
ALTER PUBLICATION supabase_realtime ADD TABLE study_sessions;

-- RLS politikalarını güncelle
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "view_active_sessions"
ON study_sessions
FOR SELECT
TO authenticated
USING (
  created_at > NOW() - INTERVAL '24 hours'
  AND ended_at IS NULL
);

-- Liderlik tablosu için trigger
CREATE OR REPLACE FUNCTION public.update_leaderboard_on_session_end()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.study_leaderboard (user_id, total_duration)
  VALUES (NEW.user_id, NEW.duration)
  ON CONFLICT (user_id) DO UPDATE
  SET 
    total_duration = study_leaderboard.total_duration + NEW.duration,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS update_leaderboard_trigger ON study_sessions;
CREATE TRIGGER update_leaderboard_trigger
AFTER UPDATE OF ended_at ON study_sessions
FOR EACH ROW
WHEN (NEW.ended_at IS NOT NULL)
EXECUTE FUNCTION public.update_leaderboard_on_session_end();

COMMIT;