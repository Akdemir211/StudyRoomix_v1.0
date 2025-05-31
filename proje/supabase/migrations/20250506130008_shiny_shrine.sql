/*
  # Şifreli Oda Üyelik Sistemi Düzeltmesi

  1. Değişiklikler
    - chat_room_members için RLS politikalarını güncelleme
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
  -- Chat Room Members politikalarını temizle
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_room_members;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_room_members'
  );
END $$;

-- Chat Room Members için yeni politikalar
CREATE POLICY "members_select"
ON chat_room_members
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id
    AND (
      NOT is_private
      OR created_by = auth.uid()
      OR EXISTS (
        SELECT 1 FROM chat_room_members
        WHERE room_id = chat_room_members.room_id
        AND user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "members_insert"
ON chat_room_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = room_id
    AND (
      NOT is_private
      OR created_by = auth.uid()
    )
  )
);

CREATE POLICY "members_delete"
ON chat_room_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Chat Messages için politikaları güncelle
DROP POLICY IF EXISTS "messages_select" ON chat_messages;
DROP POLICY IF EXISTS "messages_insert" ON chat_messages;

CREATE POLICY "messages_select"
ON chat_messages
FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM chat_room_members
    WHERE room_id = chat_messages.room_id
    AND user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM chat_rooms
    WHERE id = chat_messages.room_id
    AND NOT is_private
  )
);

CREATE POLICY "messages_insert"
ON chat_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (
    EXISTS (
      SELECT 1 FROM chat_room_members
      WHERE room_id = room_id
      AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM chat_rooms
      WHERE id = room_id
      AND NOT is_private
    )
  )
);