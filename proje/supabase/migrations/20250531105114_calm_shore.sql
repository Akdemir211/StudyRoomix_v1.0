/*
  # Update watch room messages RLS policy

  1. Changes
    - Update RLS policy for watch_room_messages table to allow message insertion
    - Policy ensures users can only send messages in rooms they are members of
    - Maintains security by checking room membership before allowing message insertion

  2. Security
    - Enable RLS on watch_room_messages table
    - Add policy for authenticated users to insert messages in rooms they are members of
    - Maintain existing policies for message selection
*/

-- Drop existing INSERT policy if it exists
DROP POLICY IF EXISTS "Users can send messages" ON watch_room_messages;

-- Create new INSERT policy with proper checks
CREATE POLICY "Users can send messages"
ON watch_room_messages
FOR INSERT
TO authenticated
WITH CHECK (
  -- User can only insert their own messages
  auth.uid() = user_id 
  AND
  -- User must be a member of the room
  EXISTS (
    SELECT 1 
    FROM watch_room_members 
    WHERE watch_room_members.room_id = watch_room_messages.room_id 
    AND watch_room_members.user_id = auth.uid()
  )
);