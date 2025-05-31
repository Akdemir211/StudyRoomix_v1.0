-- Create watch_rooms table if not exists
CREATE TABLE IF NOT EXISTS public.watch_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    is_private BOOLEAN DEFAULT false,
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create watch_room_members table if not exists
CREATE TABLE IF NOT EXISTS public.watch_room_members (
    room_id UUID REFERENCES public.watch_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (room_id, user_id)
);

-- Create watch_room_messages table if not exists
CREATE TABLE IF NOT EXISTS public.watch_room_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.watch_rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on tables if not already enabled
ALTER TABLE public.watch_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_room_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create rooms" ON public.watch_rooms;
DROP POLICY IF EXISTS "Users can view all rooms" ON public.watch_rooms;
DROP POLICY IF EXISTS "Users can delete their own rooms" ON public.watch_rooms;
DROP POLICY IF EXISTS "Users can join rooms" ON public.watch_room_members;
DROP POLICY IF EXISTS "Users can leave rooms" ON public.watch_room_members;
DROP POLICY IF EXISTS "Users can view room members" ON public.watch_room_members;
DROP POLICY IF EXISTS "Users can send messages" ON public.watch_room_messages;
DROP POLICY IF EXISTS "Users can view room messages" ON public.watch_room_messages;

-- Recreate watch rooms policies
CREATE POLICY "Users can create rooms" ON public.watch_rooms
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view all rooms" ON public.watch_rooms
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can delete their own rooms" ON public.watch_rooms
    FOR DELETE TO authenticated
    USING (auth.uid() = created_by);

-- Recreate watch room members policies
CREATE POLICY "Users can join rooms" ON public.watch_room_members
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM watch_rooms
            WHERE id = room_id AND (
                NOT is_private OR
                created_by = auth.uid() OR
                (is_private = true AND password_hash IS NOT NULL)
            )
        )
    );

CREATE POLICY "Users can leave rooms" ON public.watch_room_members
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view room members" ON public.watch_room_members
    FOR SELECT TO authenticated
    USING (true);

-- Recreate watch room messages policies
CREATE POLICY "Users can send messages" ON public.watch_room_messages
    FOR INSERT TO authenticated
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM watch_room_members
            WHERE room_id = watch_room_messages.room_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view room messages" ON public.watch_room_messages
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM watch_room_members
            WHERE room_id = watch_room_messages.room_id
            AND user_id = auth.uid()
        )
    );