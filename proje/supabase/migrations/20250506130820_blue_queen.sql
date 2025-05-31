/*
  # Fix chat_room_members policy recursion

  1. Changes
    - Drop existing problematic policies on chat_room_members table
    - Create new, corrected policies without recursion
  
  2. Security
    - Maintain RLS enabled on chat_room_members table
    - Add policy for members to read room members
    - Add policy for users to join public rooms or rooms they created
    - Add policy for members to leave rooms
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "members_select" ON chat_room_members;
DROP POLICY IF EXISTS "members_insert" ON chat_room_members;
DROP POLICY IF EXISTS "members_delete" ON chat_room_members;

-- Create new, corrected policies
CREATE POLICY "members_select" ON chat_room_members
FOR SELECT TO public
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE 
      chat_rooms.id = chat_room_members.room_id 
      AND (
        NOT chat_rooms.is_private 
        OR chat_rooms.created_by = auth.uid()
        OR chat_room_members.user_id = auth.uid()
      )
  )
);

CREATE POLICY "members_insert" ON chat_room_members
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE 
      chat_rooms.id = chat_room_members.room_id 
      AND (
        NOT chat_rooms.is_private 
        OR chat_rooms.created_by = auth.uid()
      )
  )
);

CREATE POLICY "members_delete" ON chat_room_members
FOR DELETE TO authenticated
USING (auth.uid() = user_id);