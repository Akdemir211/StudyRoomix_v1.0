/*
  # Fix chat messages RLS policies

  1. Changes
    - Enable RLS on chat_messages table
    - Add policy for authenticated users to insert messages
    - Add policy for authenticated users to read messages

  2. Security
    - Users can only insert messages if they are the message author
    - Users can only read messages from rooms they are members of or public rooms
*/

-- Enable RLS on chat_messages table (if not already enabled)
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_messages' AND policyname = 'allow_send_messages'
  ) THEN
    DROP POLICY "allow_send_messages" ON chat_messages;
  END IF;
END $$;

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'chat_messages' AND policyname = 'allow_read_messages'
  ) THEN
    DROP POLICY "allow_read_messages" ON chat_messages;
  END IF;
END $$;

-- Create policy for sending messages
CREATE POLICY "allow_send_messages" ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE chat_room_members.room_id = chat_messages.room_id
      AND chat_room_members.user_id = auth.uid()
    )
  );

-- Create policy for reading messages
CREATE POLICY "allow_read_messages" ON chat_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE chat_room_members.room_id = chat_messages.room_id
      AND chat_room_members.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE chat_rooms.id = chat_messages.room_id
      AND NOT chat_rooms.is_private
    )
  );