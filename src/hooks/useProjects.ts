
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Project {
  id: string;
  name: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

export const useProjects = (userId?: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    
    console.log('useProjects: Fetching projects for user:', userId);
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('useProjects: Error fetching projects:', error);
        throw error;
      }

      console.log('useProjects: Successfully fetched', data?.length || 0, 'projects');
      setProjects(data || []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch projects';
      console.error('useProjects: Fetch error:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Error loading projects",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  const createProject = useCallback(async (name: string) => {
    if (!userId) {
      const error = 'User authentication required';
      console.error('useProjects:', error);
      toast({
        title: "Authentication required",
        description: "Please log in to create a project",
        variant: "destructive",
      });
      return null;
    }

    console.log('useProjects: Creating project with name:', name);
    
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name,
          owner: userId
        })
        .select()
        .single();

      if (error) {
        console.error('useProjects: Error creating project:', error);
        throw error;
      }

      console.log('useProjects: Project created successfully:', data);
      
      // Add the new project to the local state
      setProjects(prev => [data, ...prev]);
      
      toast({
        title: "Project created!",
        description: "Your new project has been created successfully",
      });

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create project';
      console.error('useProjects: Create error:', errorMessage);
      toast({
        title: "Failed to create project",
        description: errorMessage,
        variant: "destructive",
      });
      return null;
    }
  }, [userId, toast]);

  return {
    projects,
    loading,
    error,
    fetchProjects,
    createProject,
    refetch: fetchProjects
  };
};
