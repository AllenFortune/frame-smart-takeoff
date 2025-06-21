
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { AuthContextType } from '@/types/auth';
import { useProfile } from '@/hooks/useProfile';
import { sendWelcomeEmail, isNewUser } from '@/utils/welcomeEmail';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { profile, fetchProfile, updateProfile: updateProfileData, clearProfile } = useProfile();

  useEffect(() => {
    let mounted = true;
    console.log('AuthProvider: Setting up auth state listener');

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) {
          console.log('AuthProvider: Component unmounted, ignoring auth state change');
          return;
        }
        
        console.log('AuthProvider: Auth state changed:', event, 'User ID:', session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Send welcome email for new signups
        if (event === 'SIGNED_IN' && session?.user) {
          if (isNewUser(session.user.created_at)) {
            const fullName = session.user.user_metadata?.full_name || '';
            const email = session.user.email || '';
            
            console.log('AuthProvider: New user detected, sending welcome email');
            // Send welcome email asynchronously without blocking
            setTimeout(() => {
              sendWelcomeEmail(session.user.id, email, fullName);
            }, 1000);
          }
        }
        
        if (session?.user) {
          // Use setTimeout to avoid the auth state change callback deadlock
          setTimeout(async () => {
            if (mounted) {
              console.log('AuthProvider: Fetching profile for user:', session.user.id);
              await fetchProfile(session.user.id);
            }
          }, 0);
        } else {
          console.log('AuthProvider: No user, clearing profile');
          clearProfile();
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    const initializeAuth = async () => {
      try {
        console.log('AuthProvider: Initializing auth, checking for existing session');
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('AuthProvider: Error getting session:', error);
        }
        
        if (!mounted) {
          console.log('AuthProvider: Component unmounted during initialization');
          return;
        }
        
        console.log('AuthProvider: Initial session check complete, user:', session?.user?.id || 'none');
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('AuthProvider: Initial user found, fetching profile');
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('AuthProvider: Error initializing auth:', error);
      } finally {
        if (mounted) {
          console.log('AuthProvider: Auth initialization complete');
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      console.log('AuthProvider: Cleaning up auth state listener');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, clearProfile]);

  const signIn = async (email: string, password: string) => {
    console.log('AuthProvider: Attempting sign in for email:', email);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('AuthProvider: Sign in error:', error);
    } else {
      console.log('AuthProvider: Sign in successful');
    }
    return { error };
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    console.log('AuthProvider: Attempting sign up for email:', email);
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName || '',
        },
      },
    });
    if (error) {
      console.error('AuthProvider: Sign up error:', error);
    } else {
      console.log('AuthProvider: Sign up successful');
    }
    return { error };
  };

  const signOut = async () => {
    console.log('AuthProvider: Signing out user');
    await supabase.auth.signOut();
    setUser(null);
    clearProfile();
    setSession(null);
    console.log('AuthProvider: Sign out complete');
  };

  const updateProfile = async (updates: Partial<typeof profile>) => {
    if (!user) {
      console.log('AuthProvider: Cannot update profile, no user logged in');
      return { error: new Error('No user logged in') };
    }
    console.log('AuthProvider: Updating profile for user:', user.id);
    return updateProfileData(user.id, updates);
  };

  const value = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
