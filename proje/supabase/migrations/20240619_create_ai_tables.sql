-- Kullanıcı tablosuna yeni alanlar ekleme
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS grade TEXT,
ADD COLUMN IF NOT EXISTS target_profession TEXT,
ADD COLUMN IF NOT EXISTS exam_score INTEGER,
ADD COLUMN IF NOT EXISTS strong_subjects TEXT[],
ADD COLUMN IF NOT EXISTS weak_subjects TEXT[],
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN DEFAULT FALSE;

-- AI sohbet geçmişi tablosu
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ödevler tablosu
CREATE TABLE IF NOT EXISTS user_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  subject TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- İndeksler - performans için
CREATE INDEX IF NOT EXISTS ai_chat_history_user_id_idx ON ai_chat_history(user_id);
CREATE INDEX IF NOT EXISTS ai_chat_history_created_at_idx ON ai_chat_history(created_at);
CREATE INDEX IF NOT EXISTS user_assignments_user_id_idx ON user_assignments(user_id);
CREATE INDEX IF NOT EXISTS user_assignments_due_date_idx ON user_assignments(due_date);

-- RLS (Row Level Security) Politikaları
ALTER TABLE ai_chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;

-- Kullanıcıların kendi verilerine erişim politikaları
CREATE POLICY user_chat_select ON ai_chat_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY user_chat_insert ON ai_chat_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_assignments_select ON user_assignments FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY user_assignments_insert ON user_assignments FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_assignments_update ON user_assignments FOR UPDATE 
  USING (auth.uid() = user_id);

-- Anon kullanıcılar için yetki ayarları
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT ON public.ai_chat_history TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.user_assignments TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated; 