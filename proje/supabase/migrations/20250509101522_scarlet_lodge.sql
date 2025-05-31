/*
  # Fix chat messages RLS policies

  1. Changes
    - Update RLS policies for chat_messages table to properly handle message creation
    - Ensure users can only send messages in rooms they are members of

  2. Security
    - Enable RLS on chat_messages table
    - Add policy for authenticated users to insert messages in rooms they're members of
*/

-- First ensure RLS is enabled
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "chat_messages_insert_policy" ON chat_messages;

-- Create new insert policy that properly checks room membership
CREATE POLICY "chat_messages_insert_policy"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id) AND 
  EXISTS (
    SELECT 1 
    FROM chat_room_members 
    WHERE 
      chat_room_members.room_id = chat_messages.room_id AND 
      chat_room_members.user_id = auth.uid()
  )
);