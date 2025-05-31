/*
  # AI Chat Mesajları için Tablo ve Politikalar

  1. Değişiklikler
    - AI sohbet mesajları için tablo oluşturma
    - RLS politikaları ekleme
    - Pro kullanıcı kontrolü
    
  2. Güvenlik
    - Sadece pro kullanıcılar erişebilir
    - Kullanıcılar sadece kendi mesajlarını görebilir
*/

-- Önce mevcut politikaları temizle
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON ai_chat_messages;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'ai_chat_messages'
  );
END $$;

-- AI sohbet mesajları için tablo
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  content text NOT NULL,
  response text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS'yi etkinleştir
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- Mesaj gönderme politikası
CREATE POLICY "allow_ai_chat_insert"
ON ai_chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_pro = true
  )
);

-- Mesaj okuma politikası
CREATE POLICY "allow_ai_chat_select"
ON ai_chat_messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND is_pro = true
  )
);