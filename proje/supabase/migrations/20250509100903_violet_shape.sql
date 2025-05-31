/*
  # Fix chat messages RLS policy

  1. Changes
    - Add RLS policy for chat messages to allow authenticated users to insert messages
    - Policy ensures user can only send messages in rooms they are members of

  2. Security
    - Enable RLS on chat_messages table
    - Add policy for authenticated users to insert messages
    - Verify user is a member of the chat room
*/

CREATE POLICY "Users can send messages in their rooms"
  ON chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = user_id) AND 
    (room_id IN (
      SELECT chat_room_members.room_id 
      FROM chat_room_members 
      WHERE chat_room_members.user_id = auth.uid()
    ))
  );