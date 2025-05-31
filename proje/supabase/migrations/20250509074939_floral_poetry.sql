/*
  # Kullanıcı Pro Üyelik Durumu

  1. Değişiklikler
    - users tablosuna is_pro kolonu ekleme
    - Pro üyelik için RLS politikaları
    
  2. Güvenlik
    - Kullanıcılar sadece kendi pro durumlarını güncelleyebilir
*/

-- Pro üyelik kolonu ekle
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_pro boolean DEFAULT false;

-- Pro üyelik için RLS politikaları
CREATE POLICY "users_update_pro_status"
ON users
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);