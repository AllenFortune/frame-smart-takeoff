
-- Apply the job_status table migration with proper RLS policies
CREATE TABLE IF NOT EXISTS job_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  job_type text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  progress integer DEFAULT 0,
  total_steps integer DEFAULT 100,
  current_step text,
  result_data jsonb DEFAULT '{}',
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

-- Enable RLS
ALTER TABLE job_status ENABLE ROW LEVEL SECURITY;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_job_status_project_id ON job_status(project_id);
CREATE INDEX IF NOT EXISTS idx_job_status_status ON job_status(status);

-- RLS Policies for job_status table
CREATE POLICY "Users can view job status for their projects" 
  ON job_status 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = job_status.project_id 
    AND projects.owner = auth.uid()
  ));

CREATE POLICY "Users can create job status for their projects" 
  ON job_status 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = job_status.project_id 
    AND projects.owner = auth.uid()
  ));

CREATE POLICY "Users can update job status for their projects" 
  ON job_status 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = job_status.project_id 
    AND projects.owner = auth.uid()
  ));

CREATE POLICY "Users can delete job status for their projects" 
  ON job_status 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM projects 
    WHERE projects.id = job_status.project_id 
    AND projects.owner = auth.uid()
  ));

-- Enable realtime for job_status table
ALTER TABLE job_status REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE job_status;
