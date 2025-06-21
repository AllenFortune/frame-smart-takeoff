
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface WizardProgressData {
  id?: string;
  project_id: string;
  user_id: string;
  active_step: string;
  step_data: {
    [stepId: string]: {
      selectedPageId?: string;
      selectedPages?: string[]; // Add this property
      status: 'pending' | 'running' | 'complete';
      overlay?: any;
    };
  };
}

export const useWizardProgress = (projectId: string) => {
  const [progress, setProgress] = useState<WizardProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const loadProgress = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data, error } = await supabase
        .from('wizard_progress')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Properly cast the database result to our interface
        const progressData: WizardProgressData = {
          id: data.id,
          project_id: data.project_id,
          user_id: data.user_id,
          active_step: data.active_step,
          step_data: data.step_data as WizardProgressData['step_data']
        };
        setProgress(progressData);
      }
    } catch (error) {
      console.error('Error loading wizard progress:', error);
      toast({
        title: "Error Loading Progress",
        description: "Failed to load saved wizard progress.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (activeStep: string, stepData: WizardProgressData['step_data']) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const progressData = {
        project_id: projectId,
        user_id: user.id,
        active_step: activeStep,
        step_data: stepData,
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('wizard_progress')
        .upsert(progressData, {
          onConflict: 'project_id,user_id'
        })
        .select()
        .single();

      if (error) throw error;

      // Properly cast the database result to our interface
      const savedProgressData: WizardProgressData = {
        id: data.id,
        project_id: data.project_id,
        user_id: data.user_id,
        active_step: data.active_step,
        step_data: data.step_data as WizardProgressData['step_data']
      };
      setProgress(savedProgressData);
    } catch (error) {
      console.error('Error saving wizard progress:', error);
      toast({
        title: "Error Saving Progress",
        description: "Failed to save wizard progress.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const resetProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { error } = await supabase
        .from('wizard_progress')
        .delete()
        .eq('project_id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;

      setProgress(null);
      
      toast({
        title: "Progress Reset",
        description: "Wizard progress has been reset."
      });
    } catch (error) {
      console.error('Error resetting wizard progress:', error);
      toast({
        title: "Error",
        description: "Failed to reset wizard progress.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    if (projectId) {
      loadProgress();
    }
  }, [projectId]);

  return {
    progress,
    loading,
    saving,
    saveProgress,
    resetProgress,
    refreshProgress: loadProgress
  };
};
