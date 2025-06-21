
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRetryableRequest } from './useRetryableRequest';

export interface Project {
  id: string;
  name: string;
  owner: string;
  created_at: string;
  updated_at: string;
}

export const useProjects = (userId?: string) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const { toast } = useToast();
  
  const { executeRequest, isLoading, error, reset } = useRetryableRequest({
    maxRetries: 3,
    baseDelay: 1000,
    circuitBreakerThreshold: 3,
    circuitBreakerTimeout: 15000,
  });

  const fetchProjects = useCallback(async () => {
    if (!userId) return;
    
    console.log('useProjects: Fetching projects for user:', userId);

    await executeRequest(
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('owner', userId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      },
      (data) => {
        console.log('useProjects: Successfully fetched', data.length, 'projects');
        setProjects(data);
      },
      (errorMessage) => {
        console.error('useProjects: Fetch error:', errorMessage);
        toast({
          title: "Error loading projects",
          description: errorMessage,
          variant: "destructive",
        });
      }
    );
  }, [userId, executeRequest, toast]);

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
    
    return await executeRequest(
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .insert({
            name,
            owner: userId
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      },
      (data) => {
        console.log('useProjects: Project created successfully:', data);
        setProjects(prev => [data, ...prev]);
        toast({
          title: "Project created!",
          description: "Your new project has been created successfully",
        });
      },
      (errorMessage) => {
        console.error('useProjects: Create error:', errorMessage);
        toast({
          title: "Failed to create project",
          description: errorMessage,
          variant: "destructive",
        });
      }
    );
  }, [userId, executeRequest, toast]);

  return {
    projects,
    loading: isLoading,
    error,
    fetchProjects,
    createProject,
    refetch: fetchProjects,
    reset
  };
};
