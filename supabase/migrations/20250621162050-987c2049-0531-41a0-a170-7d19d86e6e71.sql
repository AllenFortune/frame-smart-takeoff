
-- Convert storage buckets from public to private and update policies
UPDATE storage.buckets 
SET public = false 
WHERE id IN ('plan-pdfs', 'plan-images');

-- Remove existing public policies
DROP POLICY IF EXISTS "Public can view plan images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view processed images" ON storage.objects;

-- Create proper RLS policies for private buckets
CREATE POLICY "Users can access their own plan PDFs" ON storage.objects
FOR ALL USING (
  bucket_id = 'plan-pdfs' AND 
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can access their own plan images" ON storage.objects
FOR ALL USING (
  bucket_id = 'plan-images' AND 
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Service role can manage all files (for edge functions)
CREATE POLICY "Service role can manage all plan files" ON storage.objects
FOR ALL USING (
  bucket_id IN ('plan-pdfs', 'plan-images')
) WITH CHECK (
  bucket_id IN ('plan-pdfs', 'plan-images')
);
