'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { User as SupabaseUser, Session as SupabaseSession } from '@supabase/supabase-js';

const ADMIN_STORAGE_KEY = 'astrix_admin_session';

interface AuthContextType {
  session: SupabaseSession | null;
  user: SupabaseUser | null;
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

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<SupabaseSession | null>(null);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      
      if (typeof window !== 'undefined') {
        const adminSession = localStorage.getItem(ADMIN_STORAGE_KEY);
        if (adminSession === 'true') {
          setIsAdmin(true);
        }
      }
      setIsInitializing(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendMagicLink = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error: error?.message ?? null };
  };

  const signIn = async (email: string, password?: string): Promise<{ error: string | null }> => {
    if (password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    }
    return sendMagicLink(email);
  };

  const signUp = async (email: string, _method?: string, name?: string, password?: string): Promise<{ error: string | null; needsConfirmation?: boolean }> => {
    if (password) {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      return { error: error?.message ?? null, needsConfirmation: !!error };
    }
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error: error?.message ?? null, needsConfirmation: true };
  };

  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return { error: error?.message ?? null };
  };

  const updatePassword = async (password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.updateUser({ password });
    return { error: error?.message ?? null };
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  const signInAsAdmin = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!email || !password) {
      return { error: 'Please enter both admin email and password' };
    }
    setIsAdmin(true);
    if (typeof window !== 'undefined') {
      localStorage.setItem(ADMIN_STORAGE_KEY, 'true');
    }
    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setIsAdmin(false);
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
