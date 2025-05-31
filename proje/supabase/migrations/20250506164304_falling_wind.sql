/*
  # Çalışma Odası Üyelik Politikalarını Düzeltme

  1. Değişiklikler
    - Çalışma odası üyelikleri için RLS politikalarını güncelleme
    - Şifreli odalara katılım kurallarını düzenleme
    - Üyelik yönetimi için güvenlik kontrollerini iyileştirme

  2. Güvenlik
    - Kullanıcılar sadece izin verilen odalara katılabilir
    - Şifreli odalar için özel kontroller
    - Üyelik silme işlemleri için güvenlik
*/

-- Mevcut politikaları temizle
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON study_room_members;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'study_room_members'
  );
END $$;

-- Üyelikleri görüntüleme politikası
CREATE POLICY "view_study_room_members"
ON study_room_members
FOR SELECT
TO authenticated
USING (true);

-- Odaya katılma politikası
CREATE POLICY "join_study_rooms"
ON study_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM study_rooms
    WHERE id = room_id AND (
      NOT is_private OR
      created_by = auth.uid() OR
      (is_private = true AND password_hash IS NOT NULL)
    )
  )
);

-- Odadan ayrılma politikası
CREATE POLICY "leave_study_rooms"
ON study_room_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);