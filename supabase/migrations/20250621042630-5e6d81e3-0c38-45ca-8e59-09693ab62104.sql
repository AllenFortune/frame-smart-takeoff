
-- Create the plan-images storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('plan-images', 'plan-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create public read policy for plan-images bucket
CREATE POLICY "Public can view plan images" ON storage.objects
FOR SELECT USING (bucket_id = 'plan-images');

-- Create service role policy for plan-images bucket (for edge functions)
CREATE POLICY "Service can manage plan images" ON storage.objects
FOR ALL USING (bucket_id = 'plan-images');
