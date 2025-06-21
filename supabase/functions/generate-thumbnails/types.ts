
export interface ThumbnailConfig {
  width: number;
  height: number;
  quality: number;
  dpi: number;
}

export interface ThumbnailResult {
  data: Uint8Array;
  dimensions: { w: number; h: number };
}

export interface ProcessingResult {
  pageId: string;
  pageNo: number;
  urls?: { [key: string]: string };
  error?: string;
  generationTime: number;
  success: boolean;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}
