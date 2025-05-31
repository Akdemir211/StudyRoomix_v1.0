/*
  # Chat Room Members için RLS Politikalarını Düzeltme

  1. Değişiklikler
    - Mevcut politikaları temizle
    - Yeni, basitleştirilmiş politikalar ekle
    - Üyelik yönetimi için güvenli kurallar ekle

  2. Güvenlik
    - Kullanıcılar sadece izin verilen odalara katılabilir
    - Üyelik görüntüleme için net kurallar
    - Odadan çıkma için güvenli kontroller
*/

-- Mevcut politikaları temizle
DROP POLICY IF EXISTS "members_select" ON chat_room_members;
DROP POLICY IF EXISTS "members_insert" ON chat_room_members;
DROP POLICY IF EXISTS "members_delete" ON chat_room_members;

-- Yeni politikalar oluştur
CREATE POLICY "allow_view_members"
ON chat_room_members
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "allow_join_room"
ON chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id AND (
      NOT is_private OR
      created_by = auth.uid()
    )
  )
);

CREATE POLICY "allow_leave_room"
ON chat_room_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);