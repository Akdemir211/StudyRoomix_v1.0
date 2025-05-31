-- Mevcut politikaları temizle
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_room_members;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_room_members'
  );
END $$;

-- Yeni üyelik politikaları
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
    WHERE id = room_id
  )
);

CREATE POLICY "allow_leave_room"
ON chat_room_members
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);