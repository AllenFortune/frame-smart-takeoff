
import { supabase } from '@/integrations/supabase/client';

// Default TTL of 1 hour (3600 seconds) - can be overridden by env var
const DEFAULT_SIGNED_URL_TTL = 3600;

export async function ensureSignedUrl(path: string, ttlSeconds?: number): Promise<string> {
  console.log('Creating signed URL for path:', path);
  
  const ttl = ttlSeconds || DEFAULT_SIGNED_URL_TTL;
  
  const { data, error } = await supabase.storage
    .from('plan-images')
    .createSignedUrl(path, ttl);
    
  if (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }
  
  console.log('Successfully created signed URL with TTL:', ttl);
  return data.signedUrl;
}

export function isPublicUrl(url: string): boolean {
  if (!url) return false;
  
  // Check if URL is from Supabase storage and is public (doesn't contain token parameter)
  const isSupabaseUrl = url.includes('supabase.co/storage/v1/object/public/');
  const hasToken = url.includes('token=');
  
  return isSupabaseUrl && !hasToken;
}

export function isSignedUrlExpired(url: string): boolean {
  if (!url) return true;
  
  // Public URLs don't expire
  if (isPublicUrl(url)) {
    console.log('URL is public, never expires:', url.substring(0, 50) + '...');
    return false;
  }
  
  // Check if URL contains token parameter (signed URLs have this)
  const hasToken = url.includes('token=');
  
  if (!hasToken) {
    return true; // Not a signed URL or expired
  }
  
  // Extract expiration from URL if possible
  try {
    const urlObj = new URL(url);
    const token = urlObj.searchParams.get('token');
    
    if (!token) return true;
    
    // Try to decode JWT token to check expiration
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) return true;
    
    const payload = JSON.parse(atob(tokenParts[1]));
    const exp = payload.exp;
    
    if (!exp) return true;
    
    // Check if token is expired (with 5 minute buffer for safety)
    const now = Math.floor(Date.now() / 1000);
    const isExpired = exp <= (now + 300); // 5 minute buffer
    
    console.log(`URL expiration check: exp=${exp}, now=${now}, expired=${isExpired}`);
    return isExpired;
  } catch (error) {
    console.warn('Error checking URL expiration:', error);
    return true; // Assume expired if we can't parse
  }
}

export async function refreshSignedUrl(projectId: string, pageNo: number): Promise<string> {
  const path = `${projectId}/page_${pageNo}.png`;
  console.log('Refreshing signed URL for:', path);
  
  try {
    const newUrl = await ensureSignedUrl(path);
    console.log('Successfully refreshed signed URL');
    return newUrl;
  } catch (error) {
    console.error('Failed to refresh signed URL:', error);
    throw error;
  }
}

export async function checkImageHealth(url: string): Promise<boolean> {
  if (!url) return false;
  
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const isHealthy = response.ok;
    
    console.log(`Image health check: ${url.substring(0, 50)}... - ${isHealthy ? 'OK' : 'FAILED'}`);
    
    if (!isHealthy) {
      console.error(`Image health check failed: ${response.status} ${response.statusText}`);
    }
    
    return isHealthy;
  } catch (error) {
    console.error('Image health check error:', error);
    return false;
  }
}

export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break; // Last attempt failed
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}
