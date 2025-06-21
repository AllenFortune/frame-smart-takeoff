
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

      // Fetch pages
      const { data: pagesData, error: pagesError } = await supabase
        .from('plan_pages')
        .select('*')
        .eq('project_id', projectId)
        .order('page_no');

      if (pagesError) throw pagesError;
      setPages(pagesData || []);

      // Fetch summary
      const { data: summaryData, error: summaryError } = await supabase
        .from('plan_summaries')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (summaryError) throw summaryError;
      setSummary(summaryData);

      // Fetch overlays
      if (pagesData?.length) {
        const pageIds = pagesData.map(p => p.id);
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
