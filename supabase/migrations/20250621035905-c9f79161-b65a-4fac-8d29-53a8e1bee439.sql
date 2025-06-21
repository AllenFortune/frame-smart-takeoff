
-- Create the missing plan-pdfs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('plan-pdfs', 'plan-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for plan-pdfs bucket
CREATE POLICY "Users can upload their own PDFs" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'plan-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own PDFs" ON storage.objects
FOR SELECT USING (bucket_id = 'plan-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own PDFs" ON storage.objects
FOR DELETE USING (bucket_id = 'plan-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own PDFs" ON storage.objects
FOR UPDATE USING (bucket_id = 'plan-pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Ensure plan-images bucket exists with proper policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('plan-images', 'plan-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public can view processed images" ON storage.objects
FOR SELECT USING (bucket_id = 'plan-images');

CREATE POLICY "Service can manage processed images" ON storage.objects
FOR ALL USING (bucket_id = 'plan-images');
