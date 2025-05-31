/*
  # Sohbet Odaları RLS Politikalarını Düzeltme

  1. Değişiklikler
    - Tüm mevcut politikaları kaldır
    - Yeni, optimize edilmiş politikalar ekle
    - Sonsuz döngü sorununu çöz
    
  2. Güvenlik
    - Temel erişim kontrollerini koru
    - Performansı artır
*/

-- Önce tüm mevcut politikaları temizle
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_rooms;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_rooms'
  );
END $$;

-- Tek bir basit okuma politikası oluştur
CREATE POLICY "enable_read_access_for_all_users"
ON chat_rooms
FOR SELECT
TO public
USING (
  (NOT is_private) OR                    -- Genel odalar herkese açık
  (created_by = auth.uid()) OR           -- Oda sahibi görebilir
  (EXISTS (                              -- Üyeler görebilir
    SELECT 1 
    FROM chat_room_members 
    WHERE room_id = chat_rooms.id 
    AND user_id = auth.uid()
  ))
);

-- Oda oluşturma politikası
CREATE POLICY "authenticated_users_can_create_rooms"
ON chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- Oda güncelleme politikası
CREATE POLICY "creators_can_update_own_rooms"
ON chat_rooms
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

-- Oda silme politikası
CREATE POLICY "creators_can_delete_own_rooms"
ON chat_rooms
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Varsayılan odaları tekrar ekle
INSERT INTO chat_rooms (name, description, is_private, created_at)
VALUES
  ('Matematik', 'Matematik problemleri ve çözümleri için tartışma odası', false, now()),
  ('Fizik', 'Fizik konuları ve formüller hakkında sohbet odası', false, now()),
  ('Biyoloji', 'Biyoloji konuları ve güncel bilimsel gelişmeler', false, now()),
  ('Kimya', 'Kimya dersine ait konular ve deneyler hakkında tartışma', false, now()),
  ('Edebiyat', 'Edebiyat, kitaplar ve yazarlar hakkında sohbet', false, now()),
  ('Tarih', 'Tarih konuları ve dönemler hakkında tartışma', false, now())
ON CONFLICT DO NOTHING;