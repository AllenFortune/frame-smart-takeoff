
-- Extend plan_pages table to support multiple resolution URLs
ALTER TABLE plan_pages 
ADD COLUMN thumbnail_url TEXT,
ADD COLUMN preview_url TEXT,
ADD COLUMN full_url TEXT;

-- Create thumbnail_metadata table for tracking generation settings and performance
CREATE TABLE thumbnail_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES plan_pages(id) ON DELETE CASCADE,
  generation_time_ms INTEGER,
  file_sizes JSONB DEFAULT '{}', -- {thumbnail: 1234, preview: 5678, full: 12345}
  dimensions JSONB DEFAULT '{}', -- {thumbnail: {w: 400, h: 500}, preview: {w: 800, h: 1000}, full: {w: 1600, h: 2000}}
  format TEXT DEFAULT 'png',
  compression_level INTEGER DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create thumbnail_cache table for caching frequently accessed PDFs
CREATE TABLE thumbnail_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pdf_hash TEXT NOT NULL, -- Hash of PDF content for cache key
  pdf_url TEXT NOT NULL,
  cache_hit_count INTEGER DEFAULT 0,
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pdf_hash)
);

-- Create indexes for fast retrieval
CREATE INDEX idx_thumbnail_metadata_page_id ON thumbnail_metadata(page_id);
CREATE INDEX idx_thumbnail_cache_project_id ON thumbnail_cache(project_id);
CREATE INDEX idx_thumbnail_cache_pdf_hash ON thumbnail_cache(pdf_hash);
CREATE INDEX idx_thumbnail_cache_expires_at ON thumbnail_cache(expires_at);
CREATE INDEX idx_plan_pages_project_id_page_no ON plan_pages(project_id, page_no);

-- Enable RLS on new tables
ALTER TABLE thumbnail_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE thumbnail_cache ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for thumbnail_metadata
CREATE POLICY "Users can view thumbnail metadata for their projects" ON thumbnail_metadata
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM plan_pages pp 
    JOIN projects p ON pp.project_id = p.id 
    WHERE pp.id = thumbnail_metadata.page_id AND p.owner = auth.uid()
  )
);

CREATE POLICY "Users can insert thumbnail metadata for their projects" ON thumbnail_metadata
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM plan_pages pp 
    JOIN projects p ON pp.project_id = p.id 
    WHERE pp.id = thumbnail_metadata.page_id AND p.owner = auth.uid()
  )
);

CREATE POLICY "Users can update thumbnail metadata for their projects" ON thumbnail_metadata
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM plan_pages pp 
    JOIN projects p ON pp.project_id = p.id 
    WHERE pp.id = thumbnail_metadata.page_id AND p.owner = auth.uid()
  )
);

-- Create RLS policies for thumbnail_cache
CREATE POLICY "Users can view cache for their projects" ON thumbnail_cache
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = thumbnail_cache.project_id AND p.owner = auth.uid()
  )
);

CREATE POLICY "Users can insert cache for their projects" ON thumbnail_cache
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = thumbnail_cache.project_id AND p.owner = auth.uid()
  )
);

CREATE POLICY "Users can update cache for their projects" ON thumbnail_cache
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM projects p 
    WHERE p.id = thumbnail_cache.project_id AND p.owner = auth.uid()
  )
);
