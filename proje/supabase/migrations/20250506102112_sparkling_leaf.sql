/*
  # Sohbet Odaları Politikalarını Düzeltme

  1. Değişiklikler
    - Tüm mevcut politikaları temizle
    - Yeni, basit ve etkili politikalar ekle
    - Sonsuz döngü sorununu çöz

  2. Güvenlik
    - Genel odalar herkese açık
    - Özel odalar sadece üyelere ve sahiplerine açık
    - Temel CRUD işlemleri için net kurallar
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

-- Temel okuma politikası
CREATE POLICY "read_rooms"
ON chat_rooms
FOR SELECT
TO public
USING (
  NOT is_private -- Genel odalar herkese açık
  OR created_by = auth.uid() -- Kendi odaları
  OR EXISTS ( -- Üye olunan odalar
    SELECT 1 FROM chat_room_members
    WHERE room_id = id
    AND user_id = auth.uid()
  )
);

-- Oda oluşturma politikası
CREATE POLICY "create_rooms"
ON chat_rooms
FOR INSERT
TO public
WITH CHECK (auth.uid() IS NOT NULL);

-- Oda güncelleme politikası
CREATE POLICY "update_rooms"
ON chat_rooms
FOR UPDATE
TO public
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Oda silme politikası
CREATE POLICY "delete_rooms"
ON chat_rooms
FOR DELETE
TO public
USING (created_by = auth.uid());

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