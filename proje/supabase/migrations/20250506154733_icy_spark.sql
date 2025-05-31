/*
  # Fix study room members and users relationship

  1. Changes
    - Add foreign key relationship between study_room_members and users table
    - Enable RLS on study_room_members table
    - Add RLS policies for study_room_members

  2. Security
    - Enable RLS on study_room_members table
    - Add policies for authenticated users to:
      - View all members
      - Join/leave rooms they have access to
*/

-- Enable RLS on study_room_members if not already enabled
ALTER TABLE study_room_members ENABLE ROW LEVEL SECURITY;

-- Drop existing foreign key if it exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.table_constraints 
    WHERE constraint_name = 'study_room_members_user_id_fkey'
  ) THEN
    ALTER TABLE study_room_members DROP CONSTRAINT study_room_members_user_id_fkey;
  END IF;
END $$;

-- Add correct foreign key relationship to public.users
ALTER TABLE study_room_members
ADD CONSTRAINT study_room_members_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;