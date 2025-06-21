
export interface ExtractedPage {
  page_no: number;
  class: string;
  confidence: number;
  img_url: string;
  sheet_number?: string | null;
  plan_type?: string | null;
  description?: string | null;
}

export interface ThumbnailGenerationResult {
  success: boolean;
  data?: any;
  error?: any;
}
