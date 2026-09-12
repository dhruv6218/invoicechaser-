'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowser } from '../lib/supabase-browser';
import type { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  user_metadata: {
    full_name?: string;
    [key: string]: any;
  };
  created_at: string;
}

export interface Session {
  access_token: string;
  user: AuthUser;
}

const ADMIN_STORAGE_KEY = 'astrix_admin_session';

interface AuthContextType {
  session: Session | null;
  user: AuthUser | null;
  isInitializing: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<void>;
  signInAsAdmin: (email: string, password: string) => Promise<{ error: string | null }>;
  signIn: (email: string, password?: string) => Promise<{ error: string | null }>;
  signUp: (email: string, method?: string, name?: string, password?: string) => Promise<{ error: string | null; needsConfirmation?: boolean }>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  isInitializing: true,
  isAdmin: false,
  signOut: async () => {},
  sendMagicLink: async () => ({ error: null }),
  signInWithGoogle: async () => {},
  signInAsAdmin: async () => ({ error: null }),
  signIn: async () => ({ error: null }),
  signUp: async () => ({ error: null, needsConfirmation: false }),
  resetPassword: async () => ({ error: null }),
  updatePassword: async () => ({ error: null }),
});

function mapUser(user: User): AuthUser {
  return {
    id: user.id,
    email: user.email || '',
    user_metadata: user.user_metadata || {},
    created_at: user.created_at || new Date().toISOString(),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const supabase = getSupabaseBrowser();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check admin status from profiles table
  const checkAdminStatus = useCallback(async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('is_admin, status')
        .eq('id', userId)
        .single();
      if (data?.is_admin && data?.status !== 'blocked') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        // Check if admin override is set in localStorage
        if (typeof window !== 'undefined' && localStorage.getItem(ADMIN_STORAGE_KEY) === 'true') {
          setIsAdmin(true);
        }
      }
    } catch {
      setIsAdmin(false);
    }
  }, [supabase]);

  // Initialize: get existing session
  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (!mounted) return;

      if (existingSession) {
        const mappedUser = mapUser(existingSession.user);
        setSession(existingSession as Session);
        setUser(mappedUser);
        await checkAdminStatus(mappedUser.id);
      }
      setIsInitializing(false);
    };

    init();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      if (newSession) {
        const mappedUser = mapUser(newSession.user);
        setSession(newSession as Session);
        setUser(mappedUser);
        await checkAdminStatus(mappedUser.id);
      } else {
        setSession(null);
        setUser(null);
        setIsAdmin(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, checkAdminStatus]);

  const signUp = async (email: string, _method?: string, name?: string, password?: string): Promise<{ error: string | null; needsConfirmation?: boolean }> => {
    if (!password) return { error: 'Password is required' };
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name || email.split('@')[0] },
      },
    });
    if (error) return { error: error.message };
    return { error: null, needsConfirmation: true };
  };

  const signIn = async (email: string, password?: string): Promise<{ error: string | null }> => {
    if (!password) return { error: 'Password is required' };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const sendMagicLink = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/app` },
    });
  };

  const signInAsAdmin = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!email || !password) return { error: 'Please enter both admin email and password' };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, status')
      .eq('id', data.user.id)
      .single();

    if (!profile?.is_admin) {
      await supabase.auth.signOut();
      return { error: 'Access denied. Admin privileges required.' };
    }

    if (profile.status === 'blocked') {
      await supabase.auth.signOut();
      return { error: 'Account blocked. Contact super admin.' };
    }

    setIsAdmin(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
    }
    return { error: null };
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) return { error: error.message };
    return { error: null };
  };

  const updatePassword = async (password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setUser(null);
    setSession(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{
      session, user, isInitializing, isAdmin,
      signOut, sendMagicLink, signInWithGoogle, signInAsAdmin,
      signIn, signUp, resetPassword, updatePassword,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
