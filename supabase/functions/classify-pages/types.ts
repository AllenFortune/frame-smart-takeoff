
export interface JobData {
  id: string;
  project_id: string;
  job_type: string;
  status: string;
  progress: number;
  total_steps: number;
  current_step: string;
}

export interface ExtractedPage {
  page_no: number;
  class: string;
  confidence: number;
  img_url: string | null;
  thumbnail_url: string | null;
  preview_url: string | null;
  full_url: string | null;
}

export interface ThumbnailGenerationResult {
  success: boolean;
  data?: any;
  error?: any;
}
