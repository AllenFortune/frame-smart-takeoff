
-- Make the plan-images bucket public for easier access
UPDATE storage.buckets 
SET public = true 
WHERE id = 'plan-images';

-- Create comprehensive storage policies for plan-images bucket
-- Drop existing restrictive policies first
DROP POLICY IF EXISTS "Users can access their own plan images" ON storage.objects;

-- Create permissive policies for plan-images bucket
CREATE POLICY "Public can view plan images" ON storage.objects
FOR SELECT USING (bucket_id = 'plan-images');

CREATE POLICY "Service role can manage plan images" ON storage.objects
FOR ALL USING (bucket_id = 'plan-images')
WITH CHECK (bucket_id = 'plan-images');

CREATE POLICY "Authenticated users can upload plan images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'plan-images' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can update plan images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'plan-images' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Authenticated users can delete plan images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'plan-images' AND 
  auth.uid() IS NOT NULL
);
