
import { supabase } from '@/integrations/supabase/client';

const SIGNED_URL_TTL = parseInt(import.meta.env.VITE_SIGNED_URL_TTL || '86400'); // 24 hours default

export async function ensureSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('plan-images')
    .createSignedUrl(path, SIGNED_URL_TTL);
    
  if (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }
  
  return data.signedUrl;
}

export function isSignedUrlExpired(url: string): boolean {
  // Check if URL contains token parameter (signed URLs have this)
  return !url.includes('token=');
}

export async function refreshSignedUrl(projectId: string, pageNo: number): Promise<string> {
  const path = `${projectId}/page_${pageNo}.png`;
  return ensureSignedUrl(path);
}
