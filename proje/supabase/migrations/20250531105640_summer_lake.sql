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