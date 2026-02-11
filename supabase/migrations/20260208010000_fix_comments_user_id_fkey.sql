-- Fix comments.user_id foreign key to reference profiles.id instead of auth.users.id
-- This is needed because the frontend queries use profiles!comments_user_id_fkey to join user data
-- Profiles table already syncs with auth.users via trigger, so data consistency is maintained

-- First, drop the existing foreign key constraint
ALTER TABLE public.comments
DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- Add new foreign key constraint to reference profiles.id
-- ON DELETE CASCADE ensures comments are deleted when the profile is deleted
ALTER TABLE public.comments
ADD CONSTRAINT comments_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;