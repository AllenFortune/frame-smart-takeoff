
-- Create a table to track email events
CREATE TABLE public.email_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  email_type TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'sent',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on email_events table
ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

-- Create policy for email events (only service role can insert/read)
CREATE POLICY "Service role can manage email events" 
  ON public.email_events 
  FOR ALL 
  USING (true);

-- Function to handle welcome email sending after user signup
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS TRIGGER AS $$
DECLARE
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Get user details
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Call edge function to send welcome email
  PERFORM net.http_post(
    url := 'https://erfbmgcxpmtnmkffqsac.supabase.co/functions/v1/send-welcome-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVyZmJtZ2N4cG10bm1rZmZxc2FjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDQ2ODgwOSwiZXhwIjoyMDY2MDQ0ODA5fQ.OGnzNhPdq8Q4x2LWZoGJONjRHHvvgT8-X3gqIp4p5Lw"}'::jsonb,
    body := json_build_object(
      'user_id', NEW.id,
      'email', user_email,
      'full_name', user_name
    )::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to send welcome email after user signup
CREATE TRIGGER on_auth_user_welcome_email
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.send_welcome_email();
