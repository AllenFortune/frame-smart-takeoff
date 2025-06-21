
-- Create job_status table for tracking long-running operations
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

-- Enable realtime
ALTER TABLE job_status REPLICA IDENTITY FULL;
