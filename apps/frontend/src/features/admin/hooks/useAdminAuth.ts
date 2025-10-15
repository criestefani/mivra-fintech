import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/shared/services/supabase/client';
import { User } from '@supabase/supabase-js';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: 'super_admin' | 'admin' | 'support' | 'analyst';
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

interface UseAdminAuthReturn {
  user: User | null;
  adminUser: AdminUser | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  checkAdminAccess: () => Promise<boolean>;
}

export function useAdminAuth(): UseAdminAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch admin user data from admin_users table using RPC (bypasses RLS)
  const fetchAdminUser = useCallback(async (email: string): Promise<AdminUser | null> => {
    try {
      // Use RPC function to bypass RLS during login
      const { data, error } = await supabase
        .rpc('check_admin_email', { user_email: email });

      if (error) {
        console.error('Error fetching admin user:', error);
        return null;
      }

      // RPC returns an array, get first result
      if (!data || data.length === 0) {
        console.warn('No admin user found for email:', email);
        return null;
      }

      return data[0] as AdminUser;
    } catch (err) {
      console.error('Error in fetchAdminUser:', err);
      return null;
    }
  }, []);

  // Check if user has admin access
  const checkAdminAccess = useCallback(async (): Promise<boolean> => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser?.email) {
        return false;
      }

      const admin = await fetchAdminUser(currentUser.email);
      return admin !== null;
    } catch (err) {
      console.error('Error checking admin access:', err);
      return false;
    }
  }, [fetchAdminUser]);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (mounted && session?.user) {
          setUser(session.user);

          // Fetch admin user data
          const admin = await fetchAdminUser(session.user.email!);
          if (admin) {
            setAdminUser(admin);
          } else {
            // User is authenticated but not an admin - clear state
            setUser(null);
            setAdminUser(null);
          }
        }
      } catch (err) {
        console.error('Error initializing admin auth:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);

          if (session?.user?.email) {
            const admin = await fetchAdminUser(session.user.email);
            setAdminUser(admin);
          } else {
            setAdminUser(null);
          }

          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchAdminUser]);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      // Sign in with Supabase Auth FIRST
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // NOW check if user is admin (after successful auth)
      const admin = await fetchAdminUser(email);

      if (!admin) {
        // User authenticated but not an admin - sign them out
        await supabase.auth.signOut();
        throw new Error('Access denied. This account does not have admin privileges.');
      }

      // Update last_login_at
      await supabase
        .from('admin_users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('email', email);

      setUser(data.user);
      setAdminUser(admin);
    } catch (err) {
      const error = err as Error;
      console.error('Error signing in:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [fetchAdminUser]);

  // Sign out
  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setUser(null);
      setAdminUser(null);
    } catch (err) {
      const error = err as Error;
      console.error('Error signing out:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const isAdmin = adminUser !== null && ['super_admin', 'admin'].includes(adminUser.role);
  const isSuperAdmin = adminUser?.role === 'super_admin';

  return {
    user,
    adminUser,
    loading,
    isAdmin,
    isSuperAdmin,
    signIn,
    signOut,
    checkAdminAccess,
  };
}
