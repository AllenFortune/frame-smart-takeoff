
-- Add columns to store plan metadata
ALTER TABLE plan_pages 
ADD COLUMN sheet_number TEXT,
ADD COLUMN plan_type TEXT,
ADD COLUMN description TEXT;

-- Create index for better performance when filtering by plan type
CREATE INDEX IF NOT EXISTS idx_plan_pages_plan_type ON plan_pages(plan_type);
CREATE INDEX IF NOT EXISTS idx_plan_pages_sheet_number ON plan_pages(sheet_number);
