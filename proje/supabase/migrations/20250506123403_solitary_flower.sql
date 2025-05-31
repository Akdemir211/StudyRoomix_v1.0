/*
  # Fix Chat Rooms RLS Policies

  1. Changes
    - Remove recursive policies from chat_rooms table
    - Rewrite policies to avoid infinite recursion
    - Maintain existing security requirements:
      - Public rooms are readable by anyone
      - Private rooms are only readable by members and creators
      - Only authenticated users can create rooms
      - Only creators can update/delete their rooms

  2. Security
    - Maintains RLS on chat_rooms table
    - Simplifies policy conditions to prevent recursion
    - Ensures proper access control
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "anyone_can_read_public_rooms" ON chat_rooms;
DROP POLICY IF EXISTS "authenticated_users_can_create_rooms" ON chat_rooms;
DROP POLICY IF EXISTS "creators_can_delete_own_rooms" ON chat_rooms;
DROP POLICY IF EXISTS "creators_can_read_own_rooms" ON chat_rooms;
DROP POLICY IF EXISTS "creators_can_update_own_rooms" ON chat_rooms;
DROP POLICY IF EXISTS "members_can_read_joined_rooms" ON chat_rooms;

-- Recreate policies without recursion
-- Policy for reading public rooms
CREATE POLICY "anyone_can_read_public_rooms"
ON chat_rooms
FOR SELECT
TO public
USING (NOT is_private);

-- Policy for creators to read their own rooms
CREATE POLICY "creators_can_read_own_rooms"
ON chat_rooms
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

-- Policy for members to read joined rooms
CREATE POLICY "members_can_read_joined_rooms"
ON chat_rooms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM chat_room_members
    WHERE 
      chat_room_members.room_id = id 
      AND chat_room_members.user_id = auth.uid()
  )
);

-- Policy for creating rooms
CREATE POLICY "authenticated_users_can_create_rooms"
ON chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Policy for updating own rooms
CREATE POLICY "creators_can_update_own_rooms"
ON chat_rooms
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Policy for deleting own rooms
CREATE POLICY "creators_can_delete_own_rooms"
ON chat_rooms
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);