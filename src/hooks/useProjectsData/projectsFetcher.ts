
import { supabase, healthCheck, checkNetworkConnectivity } from '@/integrations/supabase/client';
import { Project } from './types';
import { REQUEST_TIMEOUT } from './constants';

export const fetchProjectsWithRetry = async (
  userId: string,
  retryAttempt: number,
  signal: AbortSignal
): Promise<Project[]> => {
  console.log(`useProjectsData: Fetching projects for user ${userId} (attempt ${retryAttempt + 1})`);

  // Check network connectivity first
  if (!checkNetworkConnectivity()) {
    throw new Error('No internet connection');
  }

  // Perform health check on first attempt
  if (retryAttempt === 0) {
    console.log('useProjectsData: Performing health check...');
    const isHealthy = await healthCheck();
    if (!isHealthy) {
      throw new Error('Supabase service unavailable');
    }
    console.log('useProjectsData: Health check passed');
  }

  // Set up request timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error('Request timeout'));
    }, REQUEST_TIMEOUT);
  });

  // Make the actual request with timeout
  const requestPromise = supabase
    .from('projects')
    .select(`
      *,
      sheet_count:plan_pages(count)
    `)
    .eq('owner', userId)
    .order('created_at', { ascending: false })
    .abortSignal(signal);

  const { data, error: supabaseError } = await Promise.race([
    requestPromise,
    timeoutPromise
  ]) as any;

  if (signal.aborted) {
    console.log('useProjectsData: Request was aborted');
    throw new Error('Request aborted');
  }

  if (supabaseError) {
    console.error('useProjectsData: Supabase error:', supabaseError);
    throw new Error(`Database error: ${supabaseError.message}`);
  }

  // Transform the data to flatten the sheet_count
  const transformedData = data?.map((project: any) => ({
    ...project,
    sheet_count: project.sheet_count?.[0]?.count || 0
  })) || [];

  console.log(`useProjectsData: Successfully fetched ${transformedData?.length || 0} projects`);
  return transformedData;
};
