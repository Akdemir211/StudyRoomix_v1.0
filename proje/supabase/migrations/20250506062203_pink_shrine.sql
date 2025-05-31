/*
  # Update Chat Room Policies

  1. Changes
    - Drop all existing policies for chat_rooms table
    - Create new policies for better access control:
      - Read access for authenticated users (public/private rooms)
      - Insert access for authenticated users
      - Update access for room creators
      - Delete access for room creators

  2. Security
    - All policies require authentication
    - Private room access restricted to members
    - Room creators have full control over their rooms
*/

-- First drop all existing policies for chat_rooms
DO $$ 
BEGIN
  -- Drop all policies for the chat_rooms table
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON chat_rooms;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'chat_rooms'
  );
END $$;

-- Create new policies
CREATE POLICY "Enable read access for chat rooms"
  ON chat_rooms
  FOR SELECT
  TO public
  USING (
    auth.uid() IS NOT NULL AND (
      NOT is_private OR 
      EXISTS (
        SELECT 1 FROM chat_room_members 
        WHERE room_id = id AND user_id = auth.uid()
      ) OR
      created_by = auth.uid()
    )
  );

CREATE POLICY "Enable insert for authenticated users"
  ON chat_rooms
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for room creators"
  ON chat_rooms
  FOR UPDATE
  TO public
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Enable delete for room creators"
  ON chat_rooms
  FOR DELETE
  TO public
  USING (auth.uid() = created_by);