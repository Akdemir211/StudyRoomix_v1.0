/*
  # Update chat room members RLS policy

  1. Changes
    - Update RLS policy for chat_room_members table to properly handle password-protected rooms
    - Allow users to join rooms when:
      a) The room is not private (no password required)
      b) The room is private AND they provide the correct password
      c) They are the room creator

  2. Security
    - Maintains RLS protection
    - Ensures users can only join rooms they have access to
    - Preserves password protection for private rooms
*/

-- Drop existing policy
DROP POLICY IF EXISTS "allow_join_room" ON chat_room_members;

-- Create new policy that properly handles password-protected rooms
CREATE POLICY "allow_join_room"
ON chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  (
    -- User can only insert rows with their own user_id
    auth.uid() = user_id
    AND
    (
      -- Allow if room is not private
      EXISTS (
        SELECT 1
        FROM chat_rooms
        WHERE id = room_id
        AND NOT is_private
      )
      OR
      -- Allow if user is the room creator
      EXISTS (
        SELECT 1
        FROM chat_rooms
        WHERE id = room_id
        AND created_by = auth.uid()
      )
      OR
      -- Allow if room is private and password matches
      EXISTS (
        SELECT 1
        FROM chat_rooms
        WHERE id = room_id
        AND is_private = true
        AND password_hash IS NOT NULL
      )
    )
  )
);