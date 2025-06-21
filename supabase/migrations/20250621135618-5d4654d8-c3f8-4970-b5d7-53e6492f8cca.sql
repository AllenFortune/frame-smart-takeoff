
-- Ensure the plan-pdfs bucket has proper RLS policies
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can upload their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own PDFs" ON storage.objects;

-- Create comprehensive storage policies for plan-pdfs bucket
CREATE POLICY "Users can upload to plan-pdfs bucket" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'plan-pdfs' AND 
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view plan-pdfs" ON storage.objects
FOR SELECT USING (
  bucket_id = 'plan-pdfs' AND (
    auth.uid() IS NOT NULL AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete their plan-pdfs" ON storage.objects
FOR DELETE USING (
  bucket_id = 'plan-pdfs' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their plan-pdfs" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'plan-pdfs' AND
  auth.uid() IS NOT NULL AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Also ensure public read access for processed images
CREATE POLICY "Public can view plan-images" ON storage.objects
FOR SELECT USING (bucket_id = 'plan-images');
