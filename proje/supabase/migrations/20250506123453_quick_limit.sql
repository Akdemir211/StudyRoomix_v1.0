/*
  # Fix Chat Rooms RLS Policies

  1. Changes
    - Remove potentially recursive policies
    - Rewrite policies with more efficient conditions
    - Ensure no circular dependencies in policy checks
  
  2. Security
    - Maintain existing security model
    - Prevent infinite recursion
    - Keep all necessary access controls
*/

-- First, drop the problematic policies
DROP POLICY IF EXISTS "members_can_read_joined_rooms" ON chat_rooms;

-- Recreate the policies with optimized conditions
CREATE POLICY "enable_read_access_for_all_users" ON chat_rooms
FOR SELECT
TO public
USING (
  (NOT is_private) OR                    -- Public rooms are visible to everyone
  (created_by = auth.uid()) OR           -- Creator can see their own rooms
  (EXISTS (
    SELECT 1 
    FROM chat_room_members 
    WHERE 
      chat_room_members.room_id = id AND 
      chat_room_members.user_id = auth.uid()
  ))                                     -- Members can see their joined rooms
);