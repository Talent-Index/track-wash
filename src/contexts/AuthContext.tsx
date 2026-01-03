import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'customer' | 'operator' | 'owner' | 'admin';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: UserRole | null;
  loading: boolean;
  initialized: boolean;
  signUp: (email: string, password: string, metadata?: { full_name?: string; phone?: string; role?: UserRole }) => Promise<{ error: AuthError | null; user?: User }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching profile:', error);
        return null;
      }
      
      return data;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  }, []);

  const fetchRole = useCallback(async (userId: string): Promise<UserRole | null> => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching role:', error);
        return null;
      }
      
      return data?.role as UserRole | null;
    } catch (err) {
      console.error('Error in fetchRole:', err);
      return null;
    }
  }, []);

  const loadUserData = useCallback(async (userId: string) => {
    const [profileData, roleData] = await Promise.all([
      fetchProfile(userId),
      fetchRole(userId)
    ]);
    
    setProfile(profileData);
    setRole(roleData || 'customer'); // Default to customer if no role found
  }, [fetchProfile, fetchRole]);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadUserData(user.id);
    }
  }, [user, loadUserData]);

  useEffect(() => {
    let mounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        
        if (currentSession?.user) {
          // Use setTimeout to prevent deadlock with Supabase
          setTimeout(async () => {
            if (!mounted) return;
            await loadUserData(currentSession.user.id);
            setLoading(false);
            setInitialized(true);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(async ({ data: { session: existingSession } }) => {
      if (!mounted) return;
      
      setSession(existingSession);
      setUser(existingSession?.user ?? null);
      
      if (existingSession?.user) {
        await loadUserData(existingSession.user.id);
      }
      
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserData]);

  const signUp = async (
    email: string, 
    password: string, 
    metadata?: { full_name?: string; phone?: string; role?: UserRole }
  ) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: metadata?.full_name,
          phone: metadata?.phone,
        },
      },
    });
    
    // If signup successful and role is specified, update it
    if (!error && data.user && metadata?.role && metadata.role !== 'customer') {
      // Wait for the trigger to create the user_roles entry, then update it
      let attempts = 0;
      const maxAttempts = 10;
      
      const updateRole = async (): Promise<boolean> => {
        const { error: updateError } = await supabase
          .from('user_roles')
          .update({ role: metadata.role })
          .eq('user_id', data.user!.id);
        
        return !updateError;
      };
      
      // Retry with exponential backoff
      const tryUpdate = async (): Promise<void> => {
        while (attempts < maxAttempts) {
          attempts++;
          const success = await updateRole();
          if (success) return;
          await new Promise(resolve => setTimeout(resolve, 100 * attempts));
        }
      };
      
      // Run role update in background
      tryUpdate();
    }
    
    return { error, user: data.user || undefined };
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      setLoading(false);
    }
    // If successful, onAuthStateChange will handle the rest
    
    return { error };
  };

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setRole(null);
    setLoading(false);
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    role,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
    refreshProfile,
    isAuthenticated: !!session,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
