/*
  # Update chat messages RLS policies

  1. Security Changes
    - Add RLS policy for chat messages table to allow authenticated users to:
      - Insert messages in rooms they are members of
      - Read messages from rooms they are members of
      - Delete their own messages
*/

-- Enable RLS on chat_messages table if not already enabled
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can send messages in their rooms" ON chat_messages;
DROP POLICY IF EXISTS "allow_read_messages" ON chat_messages;
DROP POLICY IF EXISTS "allow_send_messages" ON chat_messages;

-- Create new policies
CREATE POLICY "chat_messages_insert_policy" 
ON chat_messages 
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

CREATE POLICY "chat_messages_select_policy" 
ON chat_messages 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE chat_room_members.room_id = chat_messages.room_id
    AND chat_room_members.user_id = auth.uid()
  )
);

CREATE POLICY "chat_messages_delete_policy" 
ON chat_messages 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);