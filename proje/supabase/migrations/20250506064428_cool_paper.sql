/*
  # Chat System Setup

  1. New Tables
    - `users`: User profiles
      - `id` (uuid, primary key)
      - `name` (text)
      - `avatar_url` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for proper access control
    - Update existing chat room policies
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- User policies
CREATE POLICY "Users can read all profiles"
  ON users
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can update own profile"
  ON users
  FOR UPDATE
  TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Update chat_messages policies
DROP POLICY IF EXISTS "Oda üyeleri mesajları görebilir" ON chat_messages;
DROP POLICY IF EXISTS "Oda üyeleri mesaj gönderebilir" ON chat_messages;

CREATE POLICY "Enable message read for room members"
  ON chat_messages
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = chat_messages.room_id
      AND (
        NOT is_private 
        OR EXISTS (
          SELECT 1 FROM chat_room_members
          WHERE room_id = chat_messages.room_id 
          AND user_id = auth.uid()
        )
        OR created_by = auth.uid()
      )
    )
  );

CREATE POLICY "Enable message insert for room members"
  ON chat_messages
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = chat_messages.room_id
      AND (
        NOT is_private 
        OR EXISTS (
          SELECT 1 FROM chat_room_members
          WHERE room_id = chat_messages.room_id 
          AND user_id = auth.uid()
        )
        OR created_by = auth.uid()
      )
    )
  );

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, name, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();