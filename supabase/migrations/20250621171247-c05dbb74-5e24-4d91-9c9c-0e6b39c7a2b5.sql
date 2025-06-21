
-- Clean up all existing conflicting storage policies
DROP POLICY IF EXISTS "Public can view plan images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage plan images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload plan images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update plan images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete plan images" ON storage.objects;
DROP POLICY IF EXISTS "Users can access their own plan images" ON storage.objects;
DROP POLICY IF EXISTS "Users can access their own plan PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to plan-pdfs bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can view plan-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their plan-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their plan-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all plan files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view plan-images" ON storage.objects;

-- Make both buckets public for easier access (simplifies the PDF download issue)
UPDATE storage.buckets 
SET public = true 
WHERE id IN ('plan-pdfs', 'plan-images');

-- Create clean, simple policies for plan-pdfs bucket
CREATE POLICY "Public can view plan PDFs" ON storage.objects
FOR SELECT USING (bucket_id = 'plan-pdfs');

CREATE POLICY "Authenticated users can upload plan PDFs" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'plan-pdfs' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can manage their own plan PDFs" ON storage.objects
FOR ALL USING (
  bucket_id = 'plan-pdfs' AND 
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create clean, simple policies for plan-images bucket
CREATE POLICY "Public can view plan images" ON storage.objects
FOR SELECT USING (bucket_id = 'plan-images');

CREATE POLICY "Authenticated users can upload plan images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'plan-images' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can manage their own plan images" ON storage.objects
FOR ALL USING (
  bucket_id = 'plan-images' AND 
  auth.uid() IS NOT NULL
);

-- Service role can manage all files (for edge functions)
CREATE POLICY "Service role can manage all storage files" ON storage.objects
FOR ALL USING (
  bucket_id IN ('plan-pdfs', 'plan-images')
) WITH CHECK (
  bucket_id IN ('plan-pdfs', 'plan-images')
);
