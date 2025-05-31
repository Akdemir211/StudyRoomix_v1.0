/*
  # Fix chat rooms RLS policies

  1. Changes
    - Remove redundant policies that cause infinite recursion
    - Consolidate policies into simpler, more efficient ones
    - Maintain same security rules but with optimized implementation

  2. Security
    - Keep RLS enabled on chat_rooms table
    - Maintain access control for public/private rooms
    - Preserve owner privileges
*/

-- Drop existing policies to clean up
DROP POLICY IF EXISTS "chat_rooms_delete_policy" ON chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_insert_policy" ON chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_select_policy" ON chat_rooms;
DROP POLICY IF EXISTS "chat_rooms_update_policy" ON chat_rooms;
DROP POLICY IF EXISTS "delete_own_rooms" ON chat_rooms;
DROP POLICY IF EXISTS "insert_rooms" ON chat_rooms;
DROP POLICY IF EXISTS "update_own_rooms" ON chat_rooms;
DROP POLICY IF EXISTS "view_member_rooms" ON chat_rooms;
DROP POLICY IF EXISTS "view_own_rooms" ON chat_rooms;
DROP POLICY IF EXISTS "view_public_rooms" ON chat_rooms;

-- Create new, simplified policies
CREATE POLICY "enable_read_access" ON chat_rooms
  FOR SELECT
  USING (
    NOT is_private -- Allow access to public rooms
    OR created_by = auth.uid() -- Allow access to own rooms
    OR EXISTS ( -- Allow access to rooms where user is a member
      SELECT 1 FROM chat_room_members 
      WHERE room_id = id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "enable_insert" ON chat_rooms
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "enable_delete" ON chat_rooms
  FOR DELETE
  USING (created_by = auth.uid());

CREATE POLICY "enable_update" ON chat_rooms
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());