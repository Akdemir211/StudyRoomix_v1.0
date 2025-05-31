/*
  # Sohbet Odaları için RLS Politikalarını Düzeltme

  1. Değişiklikler
    - Tüm mevcut politikaları temizle
    - Basit ve net politikalar ekle
    - Sonsuz döngü sorununu çöz
    
  2. Güvenlik
    - Temel CRUD işlemleri için politikalar
    - Özel odalar için erişim kontrolü
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

-- Yeni basit politikalar ekle
CREATE POLICY "read_public_rooms" ON chat_rooms
  FOR SELECT
  USING (NOT is_private);

CREATE POLICY "read_own_rooms" ON chat_rooms
  FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "read_member_rooms" ON chat_rooms
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM chat_room_members 
      WHERE chat_room_members.room_id = chat_rooms.id 
      AND chat_room_members.user_id = auth.uid()
    )
  );

CREATE POLICY "create_rooms" ON chat_rooms
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "update_own_rooms" ON chat_rooms
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "delete_own_rooms" ON chat_rooms
  FOR DELETE
  USING (created_by = auth.uid());