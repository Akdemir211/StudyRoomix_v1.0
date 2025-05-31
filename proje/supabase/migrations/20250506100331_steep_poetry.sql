/*
  # Fix chat_room_members RLS policies

  1. Changes
    - Remove recursive policy that was causing infinite recursion
    - Simplify policies for chat_room_members table
    - Add clearer, non-recursive policies for membership management
  
  2. Security
    - Enable RLS on chat_room_members table
    - Add policies for:
      - Viewing memberships
      - Joining rooms
      - Leaving rooms
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Enable membership viewing" ON chat_room_members;
DROP POLICY IF EXISTS "Enable room joining" ON chat_room_members;
DROP POLICY IF EXISTS "Enable room membership" ON chat_room_members;

-- Create new, simplified policies
CREATE POLICY "View room memberships"
ON chat_room_members
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE chat_rooms.id = chat_room_members.room_id
    AND (
      NOT chat_rooms.is_private 
      OR chat_rooms.created_by = auth.uid()
      OR chat_room_members.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Join public rooms"
ON chat_room_members
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE chat_rooms.id = chat_room_members.room_id
    AND NOT chat_rooms.is_private
  )
);

CREATE POLICY "Join private rooms if creator"
ON chat_room_members
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE chat_rooms.id = chat_room_members.room_id
    AND chat_rooms.created_by = auth.uid()
  )
);

CREATE POLICY "Leave any joined room"
ON chat_room_members
FOR DELETE
TO public
USING (auth.uid() = user_id);