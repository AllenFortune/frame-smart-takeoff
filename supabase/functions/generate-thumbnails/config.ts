
import { ThumbnailConfig } from './types.ts';

export const THUMBNAIL_CONFIGS: { [key: string]: ThumbnailConfig } = {
  thumbnail: { width: 400, height: 500, quality: 80, dpi: 150 },
  preview: { width: 800, height: 1000, quality: 85, dpi: 200 },
  full: { width: 1600, height: 2000, quality: 90, dpi: 300 }
};

export const SIGNED_URL_TTL_SECONDS = parseInt(Deno.env.get('SIGNED_URL_TTL_SECONDS') || '3600');

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
