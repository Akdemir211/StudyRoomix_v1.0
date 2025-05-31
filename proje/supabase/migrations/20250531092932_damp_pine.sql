/*
  # Add foreign key constraint to watch_room_messages

  1. Changes
    - Add foreign key constraint from watch_room_messages.user_id to users.id
    - Enable RLS on watch_room_messages table for security
    - Add policies for message access control

  2. Security
    - Enable row level security
    - Add policies for:
      - Message insertion by authenticated users
      - Message selection by room members
*/

-- Add foreign key constraint
ALTER TABLE watch_room_messages
ADD CONSTRAINT watch_room_messages_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id)
ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE watch_room_messages ENABLE ROW LEVEL SECURITY;

-- Add RLS policies
CREATE POLICY "Users can send messages"
ON watch_room_messages
FOR INSERT
TO authenticated
WITH CHECK (
  uid() = user_id AND
  EXISTS (
    SELECT 1 FROM watch_room_members
    WHERE room_id = watch_room_messages.room_id
    AND user_id = uid()
  )
);

CREATE POLICY "Users can view room messages"
ON watch_room_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM watch_room_members
    WHERE room_id = watch_room_messages.room_id
    AND user_id = uid()
  )
);