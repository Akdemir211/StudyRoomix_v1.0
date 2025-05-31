/*
  # Sohbet Tabloları Oluşturma

  1. Yeni Tablolar
    - `chat_rooms`: Sohbet odaları
      - `id` (uuid, primary key)
      - `name` (text): Oda adı
      - `description` (text): Oda açıklaması
      - `is_private` (boolean): Özel oda mu?
      - `password_hash` (text, nullable): Özel odalar için şifre
      - `created_at` (timestamptz)
      - `created_by` (uuid): Odayı oluşturan kullanıcı
      
    - `chat_messages`: Mesajlar
      - `id` (uuid, primary key)
      - `room_id` (uuid): Hangi odaya ait
      - `user_id` (uuid): Mesajı gönderen kullanıcı
      - `content` (text): Mesaj içeriği
      - `created_at` (timestamptz)
      
    - `chat_room_members`: Oda üyeleri
      - `room_id` (uuid)
      - `user_id` (uuid)
      - `joined_at` (timestamptz)

  2. Güvenlik
    - RLS politikaları tüm tablolar için aktif
    - Genel odalar herkes tarafından görülebilir
    - Özel odalara sadece üyeler erişebilir
*/

-- Chat Rooms tablosu
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_private boolean DEFAULT false,
  password_hash text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Chat Messages tablosu
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Chat Room Members tablosu
CREATE TABLE IF NOT EXISTS chat_room_members (
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (room_id, user_id)
);

-- RLS Politikaları
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- Chat Rooms için politikalar
CREATE POLICY "Herkes genel odaları görebilir"
  ON chat_rooms
  FOR SELECT
  USING (NOT is_private OR EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE room_id = chat_rooms.id AND user_id = auth.uid()
  ));

CREATE POLICY "Kullanıcılar oda oluşturabilir"
  ON chat_rooms
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Chat Messages için politikalar
CREATE POLICY "Oda üyeleri mesajları görebilir"
  ON chat_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = chat_messages.room_id
      AND (NOT is_private OR EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Oda üyeleri mesaj gönderebilir"
  ON chat_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = chat_messages.room_id
      AND (NOT is_private OR EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
      ))
    )
  );

-- Chat Room Members için politikalar
CREATE POLICY "Herkes üyelikleri görebilir"
  ON chat_room_members
  FOR SELECT
  USING (true);

CREATE POLICY "Kullanıcılar odalara katılabilir"
  ON chat_room_members
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);