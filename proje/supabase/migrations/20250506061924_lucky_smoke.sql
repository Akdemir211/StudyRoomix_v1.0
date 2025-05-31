/*
  # Fix Chat Rooms RLS Policy

  1. Changes
    - Update RLS policy for chat_rooms table to allow proper access to rooms
    - Keep existing policies but modify the SELECT policy to work correctly
    - Ensure both public and private rooms are accessible based on membership

  2. Security
    - Maintain security by checking room privacy and membership
    - Allow access to public rooms for all users
    - Restrict private room access to members only
*/

-- Drop the existing SELECT policy
DROP POLICY IF EXISTS "Herkes genel odaları görebilir" ON chat_rooms;

-- Create new SELECT policy with correct access rules
CREATE POLICY "Enable read access for chat rooms"
  ON chat_rooms
  FOR SELECT
  USING (
    -- Allow access if:
    -- 1. The user is authenticated AND
    -- 2. Either:
    --    a. The room is public OR
    --    b. The user is a member of the private room
    auth.uid() IS NOT NULL AND (
      NOT is_private OR 
      EXISTS (
        SELECT 1 FROM chat_room_members 
        WHERE room_id = id AND user_id = auth.uid()
      )
    )
  );