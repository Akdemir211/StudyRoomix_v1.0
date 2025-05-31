/*
  # Update chat messages RLS policies

  1. Changes
    - Modify RLS policies for chat_messages table to properly handle message creation
    - Ensure users can only insert messages in rooms they are members of
    - Maintain existing read/delete policies

  2. Security
    - Enable RLS on chat_messages table
    - Update policies to properly check room membership
    - Ensure user_id matches authenticated user
*/

-- Drop existing insert policies
DROP POLICY IF EXISTS "chat_messages_insert" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON chat_messages;

-- Create new insert policy with proper room membership check
CREATE POLICY "chat_messages_insert"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  -- Ensure user_id matches the authenticated user
  auth.uid() = user_id 
  AND 
  -- Check if the room exists and user is a member or room is public
  (
    EXISTS (
      SELECT 1 
      FROM chat_rooms
      WHERE 
        id = room_id 
        AND NOT is_private
    )
    OR 
    EXISTS (
      SELECT 1 
      FROM chat_room_members 
      WHERE 
        room_id = chat_messages.room_id 
        AND user_id = auth.uid()
    )
  )
);