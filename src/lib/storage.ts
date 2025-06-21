
import { supabase } from '@/integrations/supabase/client';

const SIGNED_URL_TTL = 24 * 60 * 60; // 24 hours in seconds

export async function ensureSignedUrl(path: string): Promise<string> {
  console.log('Creating signed URL for path:', path);
  
  const { data, error } = await supabase.storage
    .from('plan-images')
    .createSignedUrl(path, SIGNED_URL_TTL);
    
  if (error) {
    console.error('Error creating signed URL:', error);
    throw error;
  }
  
  console.log('Successfully created signed URL');
  return data.signedUrl;
}

export function isSignedUrlExpired(url: string): boolean {
  if (!url) return true;
  
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
    
    // Check if token is expired (with 1 hour buffer)
    const now = Math.floor(Date.now() / 1000);
    const isExpired = exp <= (now + 3600); // 1 hour buffer
    
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
