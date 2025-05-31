/*
  # Fix chat messages RLS policies

  1. Changes
    - Update RLS policies for chat_messages table to allow proper message sending
    - Ensure users can send messages to rooms they are members of
    - Maintain existing read access rules

  2. Security
    - Enable RLS on chat_messages table (ensuring it's enabled)
    - Update INSERT policy to properly check room membership
    - Preserve existing SELECT policy for message visibility
*/

-- First ensure RLS is enabled
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them with correct permissions
DROP POLICY IF EXISTS "allow_send_messages" ON chat_messages;
DROP POLICY IF EXISTS "allow_read_messages" ON chat_messages;

-- Create policy for sending messages
-- This allows users to send messages if:
-- 1. They are the message author (user_id matches their auth.uid())
-- 2. They are a member of the room where they're sending the message
CREATE POLICY "allow_send_messages"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  (auth.uid() = user_id) AND 
  (EXISTS (
    SELECT 1 
    FROM chat_room_members 
    WHERE 
      chat_room_members.room_id = chat_messages.room_id AND 
      chat_room_members.user_id = auth.uid()
  ))
);

-- Recreate the read policy to maintain existing functionality
-- Users can read messages if:
-- 1. They are a member of the room, OR
-- 2. The room is public (not private)
CREATE POLICY "allow_read_messages"
ON chat_messages
FOR SELECT
TO authenticated
USING (
  (EXISTS (
    SELECT 1 
    FROM chat_room_members 
    WHERE 
      chat_room_members.room_id = chat_messages.room_id AND 
      chat_room_members.user_id = auth.uid()
  )) OR 
  (EXISTS (
    SELECT 1 
    FROM chat_rooms 
    WHERE 
      chat_rooms.id = chat_messages.room_id AND 
      NOT chat_rooms.is_private
  ))
);