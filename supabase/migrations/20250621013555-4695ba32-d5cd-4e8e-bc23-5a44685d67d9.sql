
-- Create the main projects table
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plan_pages table for storing classified plan sheets
CREATE TABLE public.plan_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  page_no INTEGER NOT NULL,
  class TEXT NOT NULL, -- e.g. 'Floor_Plan', 'Wall_Section'
  confidence NUMERIC NOT NULL DEFAULT 0, -- 0-1
  img_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plan_summaries table for storing extracted framing notes
CREATE TABLE public.plan_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  summary_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create plan_overlays table for storing visual overlays and GeoJSON data
CREATE TABLE public.plan_overlays (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_id UUID REFERENCES public.plan_pages(id) ON DELETE CASCADE NOT NULL,
  step TEXT NOT NULL, -- 'exterior', 'interior', 'headers', 'hardware'
  overlay_url TEXT,
  geojson JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_overlays ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects table
CREATE POLICY "Users can view their own projects" 
  ON public.projects 
  FOR SELECT 
  USING (auth.uid() = owner);

CREATE POLICY "Users can create their own projects" 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can update their own projects" 
  ON public.projects 
  FOR UPDATE 
  USING (auth.uid() = owner);

CREATE POLICY "Users can delete their own projects" 
  ON public.projects 
  FOR DELETE 
  USING (auth.uid() = owner);

-- RLS Policies for plan_pages table
CREATE POLICY "Users can view plan pages for their projects" 
  ON public.plan_pages 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = plan_pages.project_id 
    AND projects.owner = auth.uid()
  ));

CREATE POLICY "Users can create plan pages for their projects" 
  ON public.plan_pages 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = plan_pages.project_id 
    AND projects.owner = auth.uid()
  ));

CREATE POLICY "Users can update plan pages for their projects" 
  ON public.plan_pages 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = plan_pages.project_id 
    AND projects.owner = auth.uid()
  ));

CREATE POLICY "Users can delete plan pages for their projects" 
  ON public.plan_pages 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = plan_pages.project_id 
    AND projects.owner = auth.uid()
  ));

-- RLS Policies for plan_summaries table
CREATE POLICY "Users can view summaries for their projects" 
  ON public.plan_summaries 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = plan_summaries.project_id 
    AND projects.owner = auth.uid()
  ));

CREATE POLICY "Users can create summaries for their projects" 
  ON public.plan_summaries 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = plan_summaries.project_id 
    AND projects.owner = auth.uid()
  ));

CREATE POLICY "Users can update summaries for their projects" 
  ON public.plan_summaries 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = plan_summaries.project_id 
    AND projects.owner = auth.uid()
  ));

CREATE POLICY "Users can delete summaries for their projects" 
  ON public.plan_summaries 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.projects 
    WHERE projects.id = plan_summaries.project_id 
    AND projects.owner = auth.uid()
  ));

-- RLS Policies for plan_overlays table
CREATE POLICY "Users can view overlays for their projects" 
  ON public.plan_overlays 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.plan_pages 
    JOIN public.projects ON projects.id = plan_pages.project_id
    WHERE plan_pages.id = plan_overlays.page_id 
    AND projects.owner = auth.uid()
  ));

CREATE POLICY "Users can create overlays for their projects" 
  ON public.plan_overlays 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.plan_pages 
    JOIN public.projects ON projects.id = plan_pages.project_id
    WHERE plan_pages.id = plan_overlays.page_id 
    AND projects.owner = auth.uid()
  ));

CREATE POLICY "Users can update overlays for their projects" 
  ON public.plan_overlays 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.plan_pages 
    JOIN public.projects ON projects.id = plan_pages.project_id
    WHERE plan_pages.id = plan_overlays.page_id 
    AND projects.owner = auth.uid()
  ));

CREATE POLICY "Users can delete overlays for their projects" 
  ON public.plan_overlays 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.plan_pages 
    JOIN public.projects ON projects.id = plan_pages.project_id
    WHERE plan_pages.id = plan_overlays.page_id 
    AND projects.owner = auth.uid()
  ));

-- Create storage bucket for plan images and overlays
INSERT INTO storage.buckets (id, name, public) 
VALUES ('plan-images', 'plan-images', true);

-- Storage policies for plan images bucket
CREATE POLICY "Users can view plan images" 
  ON storage.objects 
  FOR SELECT 
  USING (bucket_id = 'plan-images');

CREATE POLICY "Users can upload plan images" 
  ON storage.objects 
  FOR INSERT 
  WITH CHECK (bucket_id = 'plan-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update plan images" 
  ON storage.objects 
  FOR UPDATE 
  USING (bucket_id = 'plan-images' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete plan images" 
  ON storage.objects 
  FOR DELETE 
  USING (bucket_id = 'plan-images' AND auth.role() = 'authenticated');
