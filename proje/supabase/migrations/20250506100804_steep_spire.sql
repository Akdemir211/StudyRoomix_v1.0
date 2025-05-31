/*
  # Veritabanı Politikalarını Düzeltme

  1. Değişiklikler
    - Tüm mevcut politikaları temizle
    - Yeni, basitleştirilmiş politikalar ekle
    - Sonsuz döngüleri önle
    - Realtime desteğini düzelt

  2. Güvenlik
    - Oda görünürlüğü için net kurallar
    - Üyelik yönetimi için güvenli politikalar
    - Mesaj erişimi için doğru kontroller
*/

-- Mevcut politikaları temizle
DO $$ 
BEGIN
  -- chat_rooms politikalarını temizle
  DROP POLICY IF EXISTS "view_public_rooms" ON chat_rooms;
  DROP POLICY IF EXISTS "view_own_rooms" ON chat_rooms;
  DROP POLICY IF EXISTS "view_member_rooms" ON chat_rooms;
  DROP POLICY IF EXISTS "insert_rooms" ON chat_rooms;
  DROP POLICY IF EXISTS "update_own_rooms" ON chat_rooms;
  DROP POLICY IF EXISTS "delete_own_rooms" ON chat_rooms;

  -- chat_room_members politikalarını temizle
  DROP POLICY IF EXISTS "View room memberships" ON chat_room_members;
  DROP POLICY IF EXISTS "Join public rooms" ON chat_room_members;
  DROP POLICY IF EXISTS "Join private rooms if creator" ON chat_room_members;
  DROP POLICY IF EXISTS "Leave any joined room" ON chat_room_members;

  -- chat_messages politikalarını temizle
  DROP POLICY IF EXISTS "Enable message access" ON chat_messages;
  DROP POLICY IF EXISTS "Enable message insert for room members" ON chat_messages;
END $$;

-- Chat Rooms için yeni politikalar
CREATE POLICY "view_public_rooms"
  ON chat_rooms
  FOR SELECT
  TO public
  USING (NOT is_private);

CREATE POLICY "view_own_rooms"
  ON chat_rooms
  FOR SELECT
  TO public
  USING (auth.uid() = created_by);

CREATE POLICY "view_member_rooms"
  ON chat_rooms
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM chat_room_members
      WHERE room_id = chat_rooms.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "insert_rooms"
  ON chat_rooms
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "update_own_rooms"
  ON chat_rooms
  FOR UPDATE
  TO public
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "delete_own_rooms"
  ON chat_rooms
  FOR DELETE
  TO public
  USING (auth.uid() = created_by);

-- Chat Room Members için yeni politikalar
CREATE POLICY "view_room_memberships"
  ON chat_room_members
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM chat_rooms
      WHERE id = chat_room_members.room_id
      AND (
        NOT is_private
        OR created_by = auth.uid()
        OR chat_room_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "join_public_rooms"
  ON chat_room_members
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM chat_rooms
      WHERE id = room_id
      AND NOT is_private
    )
  );

CREATE POLICY "join_private_rooms"
  ON chat_room_members
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM chat_rooms
      WHERE id = room_id
      AND (created_by = auth.uid())
    )
  );

CREATE POLICY "leave_rooms"
  ON chat_room_members
  FOR DELETE
  TO public
  USING (auth.uid() = user_id);

-- Chat Messages için yeni politikalar
CREATE POLICY "read_messages"
  ON chat_messages
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1
      FROM chat_rooms
      WHERE id = chat_messages.room_id
      AND (
        NOT is_private
        OR created_by = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM chat_room_members
          WHERE room_id = chat_messages.room_id
          AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "send_messages"
  ON chat_messages
  FOR INSERT
  TO public
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1
      FROM chat_rooms
      WHERE id = room_id
      AND (
        NOT is_private
        OR created_by = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM chat_room_members
          WHERE room_id = chat_messages.room_id
          AND user_id = auth.uid()
        )
      )
    )
  );

-- Realtime yayınlarını güncelle
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public'
    AND tablename = 'chat_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public'
    AND tablename = 'chat_rooms'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public'
    AND tablename = 'chat_room_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_members;
  END IF;
END $$;