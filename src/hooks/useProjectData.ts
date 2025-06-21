
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { refreshSignedUrl, isSignedUrlExpired } from '@/lib/storage';

export interface Project {
  id: string;
  name: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

export interface PlanPage {
  id: string;
  project_id: string;
  page_no: number;
  class: string;
  confidence: number;
  img_url: string | null;
  created_at: string;
}

export interface PlanSummary {
  id: string;
  project_id: string;
  summary_json: {
    wall_height_ft?: number;
    num_stories?: number;
    shear_wall_tags?: string[];
    nailing_table_refs?: string[];
    general_notes?: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface PlanOverlay {
  id: string;
  page_id: string;
  step: string;
  overlay_url: string | null;
  geojson: any;
  created_at: string;
  updated_at: string;
}

export const useProjectData = (projectId: string) => {
  const [project, setProject] = useState<Project | null>(null);
  const [pages, setPages] = useState<PlanPage[]>([]);
  const [summary, setSummary] = useState<PlanSummary | null>(null);
  const [overlays, setOverlays] = useState<PlanOverlay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch pages - get only the most recent entry per page number
      // This handles duplicate entries by selecting the latest created_at for each page_no
      const { data: pagesData, error: pagesError } = await supabase
        .from('plan_pages')
        .select('*')
        .eq('project_id', projectId)
        .order('page_no')
        .order('created_at', { ascending: false });

      if (pagesError) throw pagesError;

      // Deduplicate pages by keeping only the most recent entry per page_no
      const uniquePages = pagesData ? 
        pagesData.reduce((acc: PlanPage[], current: PlanPage) => {
          const existingPageIndex = acc.findIndex(page => page.page_no === current.page_no);
          if (existingPageIndex === -1) {
            // No existing page with this page_no, add it
            acc.push(current);
          } else {
            // Compare creation dates and keep the more recent one
            const existingPage = acc[existingPageIndex];
            if (new Date(current.created_at) > new Date(existingPage.created_at)) {
              acc[existingPageIndex] = current;
            }
          }
          return acc;
        }, []).sort((a, b) => a.page_no - b.page_no) : [];

      console.log(`Fetched ${pagesData?.length || 0} total page entries, deduped to ${uniquePages.length} unique pages`);

      // Refresh expired signed URLs
      const pagesWithFreshUrls = await Promise.all(
        uniquePages.map(async (page) => {
          if (page.img_url && isSignedUrlExpired(page.img_url)) {
            console.log(`Refreshing expired URL for page ${page.page_no}`);
            try {
              const freshUrl = await refreshSignedUrl(projectId, page.page_no);
              return { ...page, img_url: freshUrl };
            } catch (error) {
              console.error(`Failed to refresh URL for page ${page.page_no}:`, error);
              return page;
            }
          }
          return page;
        })
      );

      setPages(pagesWithFreshUrls);

      // Debug: Log image URLs to check their format
      pagesWithFreshUrls.forEach(page => {
        if (page.img_url) {
          console.log(`Page ${page.page_no} image URL: ${page.img_url}`);
        } else {
          console.log(`Page ${page.page_no} has no image URL`);
        }
      });

      // Fetch summary with proper type handling
      const { data: summaryData, error: summaryError } = await supabase
        .from('plan_summaries')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (summaryError) throw summaryError;
      
      // Transform the summary data to match our interface
      if (summaryData) {
        const transformedSummary: PlanSummary = {
          ...summaryData,
          summary_json: typeof summaryData.summary_json === 'object' && summaryData.summary_json !== null
            ? summaryData.summary_json as PlanSummary['summary_json']
            : {}
        };
        setSummary(transformedSummary);
      }

      // Fetch overlays
      if (pagesWithFreshUrls?.length) {
        const pageIds = pagesWithFreshUrls.map(p => p.id);
        const { data: overlaysData, error: overlaysError } = await supabase
          .from('plan_overlays')
          .select('*')
          .in('page_id', pageIds);

        if (overlaysError) throw overlaysError;
        setOverlays(overlaysData || []);
      }

    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchProjectData();
  };

  return {
    project,
    pages,
    summary,
    overlays,
    loading,
    error,
    refreshData
  };
};
