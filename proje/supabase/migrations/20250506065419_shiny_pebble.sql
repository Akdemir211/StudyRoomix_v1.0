-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- Enable realtime for chat rooms
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;

-- Enable realtime for chat room members
ALTER PUBLICATION supabase_realtime ADD TABLE chat_room_members;

-- Update RLS policies to ensure proper realtime access
CREATE POLICY "Enable realtime for public rooms"
  ON chat_rooms
  FOR SELECT
  TO public
  USING (
    NOT is_private OR 
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE room_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Enable realtime for messages"
  ON chat_messages
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id AND (
        NOT is_private OR
        created_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM chat_room_members
          WHERE room_id = chat_messages.room_id AND user_id = auth.uid()
        )
      )
    )
  );