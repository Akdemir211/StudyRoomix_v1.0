/*
  # Çalışma Odaları Sistemi

  1. Yeni Tablolar
    - `study_rooms`: Çalışma odaları
      - `id` (uuid, primary key)
      - `name` (text): Oda adı
      - `description` (text): Oda açıklaması
      - `is_private` (boolean): Özel oda mu?
      - `password_hash` (text): Şifreli odalar için şifre
      - `created_at` (timestamptz)
      - `created_by` (uuid): Odayı oluşturan kullanıcı
      
    - `study_room_members`: Oda üyeleri
      - `room_id` (uuid): Hangi oda
      - `user_id` (uuid): Hangi kullanıcı
      - `joined_at` (timestamptz)
      - `current_session_id` (uuid): Aktif çalışma oturumu

  2. Güvenlik
    - RLS politikaları tüm tablolar için aktif
    - Özel odalar sadece şifreyle erişilebilir
*/

-- Çalışma Odaları tablosu
CREATE TABLE IF NOT EXISTS study_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_private boolean DEFAULT false,
  password_hash text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Çalışma Odası Üyeleri tablosu
CREATE TABLE IF NOT EXISTS study_room_members (
  room_id uuid REFERENCES study_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  current_session_id uuid REFERENCES study_sessions(id) ON DELETE SET NULL,
  PRIMARY KEY (room_id, user_id)
);

-- RLS'yi etkinleştir
ALTER TABLE study_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_room_members ENABLE ROW LEVEL SECURITY;

-- Çalışma Odaları için politikalar
CREATE POLICY "view_study_rooms"
ON study_rooms
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "create_study_rooms"
ON study_rooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "update_own_study_rooms"
ON study_rooms
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "delete_own_study_rooms"
ON study_rooms
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Çalışma Odası Üyeleri için politikalar
CREATE POLICY "view_study_room_members"
ON study_room_members
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "join_study_rooms"
ON study_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM study_rooms
    WHERE id = room_id AND (
      NOT is_private OR
      created_by = auth.uid()
    )
  )
);

CREATE POLICY "leave_study_rooms"
ON study_room_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Realtime özelliğini etkinleştir
ALTER PUBLICATION supabase_realtime ADD TABLE study_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE study_room_members;