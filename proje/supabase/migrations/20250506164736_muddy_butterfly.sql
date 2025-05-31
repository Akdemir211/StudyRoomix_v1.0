/*
  # Oda Politikalarını Güncelleme

  1. Değişiklikler
    - Mevcut politikaları temizle
    - Yeni, basitleştirilmiş politikalar ekle
    - Oda silme yetkisi ekle

  2. Güvenlik
    - Kullanıcılar sadece kendi odalarını silebilir
    - Tüm değişiklikler realtime olarak yansıyacak
*/

-- Mevcut politikaları temizle
DO $$ 
BEGIN
  -- Chat Rooms politikalarını temizle
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_rooms;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_rooms'
  );
  
  -- Study Rooms politikalarını temizle
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON study_rooms;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'study_rooms'
  );
END $$;

-- Chat Rooms için yeni politikalar
CREATE POLICY "chat_rooms_select"
ON chat_rooms
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "chat_rooms_insert"
ON chat_rooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "chat_rooms_delete"
ON chat_rooms
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);

-- Study Rooms için yeni politikalar
CREATE POLICY "study_rooms_select"
ON study_rooms
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "study_rooms_insert"
ON study_rooms
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "study_rooms_delete"
ON study_rooms
FOR DELETE
TO authenticated
USING (auth.uid() = created_by);