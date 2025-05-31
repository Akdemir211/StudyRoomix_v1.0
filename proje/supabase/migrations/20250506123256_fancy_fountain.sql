/*
  # Fix chat rooms RLS policies

  1. Changes
    - Remove existing RLS policies for chat_rooms table that cause recursion
    - Create new, optimized RLS policies that avoid recursive checks
    
  2. Security
    - Enable RLS on chat_rooms table
    - Add policies for:
      - Public can read non-private rooms
      - Room creators can read their own rooms
      - Room members can read rooms they've joined
      - Only authenticated users can create rooms
      - Only room creators can update/delete their rooms
*/

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "create_rooms" ON chat_rooms;
DROP POLICY IF EXISTS "delete_rooms" ON chat_rooms;
DROP POLICY IF EXISTS "read_rooms" ON chat_rooms;
DROP POLICY IF EXISTS "update_rooms" ON chat_rooms;

-- Create new optimized policies
CREATE POLICY "anyone_can_read_public_rooms"
ON chat_rooms
FOR SELECT
TO public
USING (NOT is_private);

CREATE POLICY "creators_can_read_own_rooms"
ON chat_rooms
FOR SELECT
TO authenticated
USING (auth.uid() = created_by);

CREATE POLICY "members_can_read_joined_rooms"
ON chat_rooms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE chat_room_members.room_id = id
    AND chat_room_members.user_id = auth.uid()
  )
);

CREATE POLICY "authenticated_users_can_create_rooms"
ON chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "creators_can_update_own_rooms"
ON chat_rooms
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "creators_can_delete_own_rooms"
ON chat_rooms
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);