
-- Drop the trigger that's causing signup failures
DROP TRIGGER IF EXISTS on_auth_user_welcome_email ON auth.users;

-- Drop the function that requires the net extension
DROP FUNCTION IF EXISTS public.send_welcome_email();
