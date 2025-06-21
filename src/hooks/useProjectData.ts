
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
  thumbnail_url: string | null;
  preview_url: string | null;
  full_url: string | null;
  sheet_number?: string | null;
  plan_type?: string | null;
  description?: string | null;
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
      
      console.log('Fetching project data for:', projectId);

      // Fetch project
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);
      console.log('Fetched project:', projectData?.name);

      // Fetch pages with new multi-resolution URLs
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
            acc.push(current);
          } else {
            const existingPage = acc[existingPageIndex];
            if (new Date(current.created_at) > new Date(existingPage.created_at)) {
              acc[existingPageIndex] = current;
            }
          }
          return acc;
        }, []).sort((a, b) => a.page_no - b.page_no) : [];

      console.log(`Fetched ${pagesData?.length || 0} total page entries, deduped to ${uniquePages.length} unique pages`);

      // Process URLs - prioritize multi-resolution URLs
      const pagesWithValidUrls = await Promise.all(
        uniquePages.map(async (page) => {
          // Use the best available URL - prefer preview_url, fallback to img_url
          const bestUrl = page.preview_url || page.img_url;
          
          if (!bestUrl) {
            console.log(`Page ${page.page_no} has no image URL`);
            return page;
          }

          // Check if URL is expired for signed URLs
          if (isSignedUrlExpired(bestUrl)) {
            console.log(`URL expired for page ${page.page_no}, will refresh on demand`);
          } else {
            console.log(`Page ${page.page_no} has valid URL (resolution: ${page.preview_url ? 'preview' : 'fallback'})`);
          }

          return page;
        })
      );

      setPages(pagesWithValidUrls);

      // Fetch summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('plan_summaries')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (summaryError) throw summaryError;
      
      if (summaryData) {
        const transformedSummary: PlanSummary = {
          ...summaryData,
          summary_json: typeof summaryData.summary_json === 'object' && summaryData.summary_json !== null
            ? summaryData.summary_json as PlanSummary['summary_json']
            : {}
        };
        setSummary(transformedSummary);
        console.log('Fetched project summary');
      }

      // Fetch overlays
      if (pagesWithValidUrls?.length) {
        const pageIds = pagesWithValidUrls.map(p => p.id);
        const { data: overlaysData, error: overlaysError } = await supabase
          .from('plan_overlays')
          .select('*')
          .in('page_id', pageIds);

        if (overlaysError) throw overlaysError;
        setOverlays(overlaysData || []);
        console.log(`Fetched ${overlaysData?.length || 0} overlays`);
      }

    } catch (err) {
      console.error('Error fetching project data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    console.log('Refreshing project data...');
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
