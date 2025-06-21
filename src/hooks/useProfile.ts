
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/auth';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log('useProfile: Fetching profile for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('useProfile: Error fetching profile:', error);
        return;
      }

      console.log('useProfile: Successfully fetched profile');
      setProfile(data);
    } catch (error) {
      console.error('useProfile: Error fetching profile:', error);
    }
  }, []);

  const updateProfile = useCallback(async (userId: string, updates: Partial<Profile>) => {
    try {
      console.log('useProfile: Updating profile for user:', userId);
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId);

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
        console.log('useProfile: Successfully updated profile');
      } else {
        console.error('useProfile: Error updating profile:', error);
      }

      return { error };
    } catch (error) {
      console.error('useProfile: Error updating profile:', error);
      return { error: error as Error };
    }
  }, []);

  const clearProfile = useCallback(() => {
    console.log('useProfile: Clearing profile');
    setProfile(null);
  }, []);

  return {
    profile,
    fetchProfile,
    updateProfile,
    clearProfile,
  };
}
