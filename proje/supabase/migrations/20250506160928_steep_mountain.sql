/*
  # Study Sessions RLS Policies

  1. Changes
    - Drop existing policies to avoid conflicts
    - Enable RLS on study_sessions table
    - Add policies for:
      - Creating sessions
      - Viewing sessions
      - Updating sessions

  2. Security
    - Users can only access their own sessions
    - Authentication required for all operations
*/

-- Drop existing policies if they exist
DO $$ 
BEGIN
  EXECUTE (
    SELECT string_agg('DROP POLICY IF EXISTS ' || quote_ident(policyname) || ' ON study_sessions;', E'\n')
    FROM pg_policies 
    WHERE tablename = 'study_sessions'
  );
END $$;

-- Enable RLS
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own sessions
CREATE POLICY "Users can create their own sessions"
ON study_sessions
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
);

-- Allow users to view their own sessions
CREATE POLICY "Users can view their own sessions"
ON study_sessions
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
);

-- Allow users to update their own sessions
CREATE POLICY "Users can update their own sessions"
ON study_sessions
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id
)
WITH CHECK (
  auth.uid() = user_id
);