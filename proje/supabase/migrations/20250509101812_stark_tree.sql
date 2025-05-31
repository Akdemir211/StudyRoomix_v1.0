/*
  # Update chat messages RLS policies

  1. Changes
    - Enable RLS on chat_messages table
    - Add policy for inserting messages
    - Add policy for selecting messages
    - Add policy for deleting messages

  2. Security
    - Users can only insert messages in rooms they are members of
    - Users can only view messages in rooms they are members of
    - Users can only delete their own messages
*/

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert messages in their rooms"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE chat_room_members.room_id = chat_messages.room_id
    AND chat_room_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view messages in their rooms"
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

CREATE POLICY "Users can delete their own messages"
ON chat_messages
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);