/*
  # Fix chat rooms RLS policies

  1. Changes
    - Remove conflicting and recursive policies from chat_rooms table
    - Create new, simplified policies for room access
    
  2. Security
    - Maintain proper access control while preventing infinite recursion
    - Users can:
      - View public rooms
      - View rooms they created
      - View private rooms they are members of
*/

-- Drop existing policies that are causing recursion
DROP POLICY IF EXISTS "Enable public room access" ON chat_rooms;
DROP POLICY IF EXISTS "Enable read access for chat rooms" ON chat_rooms;
DROP POLICY IF EXISTS "Enable room visibility for all users" ON chat_rooms;

-- Create new, simplified policies
CREATE POLICY "Allow viewing public rooms"
ON chat_rooms
FOR SELECT
TO public
USING (
  NOT is_private
);

CREATE POLICY "Allow viewing own rooms"
ON chat_rooms
FOR SELECT
TO public
USING (
  auth.uid() = created_by
);

CREATE POLICY "Allow viewing joined private rooms"
ON chat_rooms
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 
    FROM chat_room_members 
    WHERE 
      chat_room_members.room_id = id 
      AND chat_room_members.user_id = auth.uid()
  )
);