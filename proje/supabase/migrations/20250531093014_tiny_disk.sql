-- Check if policies exist and create if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'watch_room_messages' 
        AND policyname = 'Users can send messages'
    ) THEN
        CREATE POLICY "Users can send messages"
        ON watch_room_messages
        FOR INSERT
        TO authenticated
        WITH CHECK (
            uid() = user_id AND
            EXISTS (
                SELECT 1 FROM watch_room_members
                WHERE room_id = watch_room_messages.room_id
                AND user_id = uid()
            )
        );
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'watch_room_messages' 
        AND policyname = 'Users can view room messages'
    ) THEN
        CREATE POLICY "Users can view room messages"
        ON watch_room_messages
        FOR SELECT
        TO authenticated
        USING (
            EXISTS (
                SELECT 1 FROM watch_room_members
                WHERE room_id = watch_room_messages.room_id
                AND user_id = uid()
            )
        );
    END IF;
END
$$;