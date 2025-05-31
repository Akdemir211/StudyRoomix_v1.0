-- Video durumu için yeni tablo oluştur
CREATE TABLE watch_room_video_states (
  room_id UUID PRIMARY KEY REFERENCES watch_rooms(id) ON DELETE CASCADE,
  current_time FLOAT NOT NULL DEFAULT 0,
  is_playing BOOLEAN NOT NULL DEFAULT false,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- RLS'i etkinleştir
ALTER TABLE watch_room_video_states ENABLE ROW LEVEL SECURITY;

-- RLS politikaları
CREATE POLICY "Users can view video states"
ON watch_room_video_states
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM watch_room_members
    WHERE room_id = watch_room_video_states.room_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update video states"
ON watch_room_video_states
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM watch_room_members
    WHERE room_id = watch_room_video_states.room_id
    AND user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM watch_room_members
    WHERE room_id = watch_room_video_states.room_id
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert video states"
ON watch_room_video_states
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM watch_room_members
    WHERE room_id = watch_room_video_states.room_id
    AND user_id = auth.uid()
  )
);