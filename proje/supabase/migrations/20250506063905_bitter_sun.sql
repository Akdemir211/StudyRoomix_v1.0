/*
  # Add Default Public Chat Rooms

  1. Changes
    - Add default public rooms for different subjects
    - Each room will be public (is_private = false)
    - Rooms will be created with a system user ID

  2. Rooms Added
    - Mathematics
    - Physics
    - Biology
    - Chemistry
    - Literature
    - History
*/

-- Insert default public rooms
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
ON CONFLICT (id) DO NOTHING;