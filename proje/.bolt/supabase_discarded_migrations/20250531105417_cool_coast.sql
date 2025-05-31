-- Enable RLS
ALTER TABLE watch_room_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can send messages" ON watch_room_messages;
DROP POLICY IF EXISTS "Users can view room messages" ON watch_room_messages;

-- Create new policies
CREATE POLICY "Users can send messages"
ON watch_room_messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM watch_room_members
    WHERE watch_room_members.room_id = watch_room_messages.room_id
    AND watch_room_members.user_id = auth.uid()
  )
);

CREATE POLICY "Users can view room messages"
ON watch_room_messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM watch_room_members
    WHERE watch_room_members.room_id = watch_room_messages.room_id
    AND watch_room_members.user_id = auth.uid()
  )
);