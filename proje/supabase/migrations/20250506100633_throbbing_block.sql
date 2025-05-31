/*
  # Fix chat rooms RLS policies

  1. Changes
    - Remove existing policies that cause recursion
    - Create new, simplified policies for chat rooms
    
  2. Security
    - Enable RLS on chat_rooms table (maintained)
    - Add policy for viewing public rooms
    - Add policy for viewing rooms user has created
    - Add policy for viewing rooms user is a member of
    - Add policy for inserting rooms
    - Add policy for updating own rooms
    - Add policy for deleting own rooms
*/

-- Drop existing policies that are causing recursion
DROP POLICY IF EXISTS "Allow viewing joined private rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Allow viewing own rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Allow viewing public rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Enable delete for room creators" ON chat_rooms;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON chat_rooms;
DROP POLICY IF EXISTS "Enable update for room creators" ON chat_rooms;

-- Create new, simplified policies
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
    SELECT 1 FROM chat_room_members
    WHERE chat_room_members.room_id = id
    AND chat_room_members.user_id = auth.uid()
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