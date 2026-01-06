
-- Remove the invalid foreign key constraint that references a non-existent 'users' table
ALTER TABLE public.video_history DROP CONSTRAINT IF EXISTS video_history_user_id_fkey;
