-- Insert default public rooms if they don't exist
INSERT INTO chat_rooms (name, description, is_private, created_at)
VALUES
  (
    'Matematik',
    'Matematik problemleri ve çözümleri için tartışma odası',
    false,
    now()
  ),
  (
    'Fizik',
    'Fizik konuları ve formüller hakkında sohbet odası',
    false,
    now()
  ),
  (
    'Biyoloji',
    'Biyoloji konuları ve güncel bilimsel gelişmeler',
    false,
    now()
  ),
  (
    'Kimya',
    'Kimya dersine ait konular ve deneyler hakkında tartışma',
    false,
    now()
  ),
  (
    'Edebiyat',
    'Edebiyat, kitaplar ve yazarlar hakkında sohbet',
    false,
    now()
  ),
  (
    'Tarih',
    'Tarih konuları ve dönemler hakkında tartışma',
    false,
    now()
  )
ON CONFLICT DO NOTHING;

-- Ensure RLS policies are correctly set
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_room_members ENABLE ROW LEVEL SECURITY;

-- Update chat room policies
CREATE POLICY "Enable public room access"
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

-- Update message policies
CREATE POLICY "Enable message access"
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