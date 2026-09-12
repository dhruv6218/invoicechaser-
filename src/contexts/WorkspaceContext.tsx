'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSupabaseBrowser } from '../lib/supabase-browser';
import { Workspace } from '../types';

interface WorkspaceContextType {
  activeWorkspace: Workspace | null;
  workspaces: Workspace[];
  isWorkspaceInitializing: boolean;
  setActiveWorkspace: (ws: Workspace) => void;
  refreshWorkspaces: () => Promise<void>;
  updateWorkspaceName: (name: string) => void;
}

const WorkspaceContext = createContext<WorkspaceContextType>({
  activeWorkspace: null, workspaces: [], isWorkspaceInitializing: true,
  setActiveWorkspace: () => {}, refreshWorkspaces: async () => {},
  updateWorkspaceName: () => {},
});

const STORAGE_KEY = 'astrix_active_workspace_id';

export const WorkspaceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const supabase = getSupabaseBrowser();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspace, setActiveWs] = useState<Workspace | null>(null);
  const [isWorkspaceInitializing, setIsWorkspaceInitializing] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    if (!user) {
      setWorkspaces([]);
      setActiveWs(null);
      setIsWorkspaceInitializing(false);
      return;
    }

    setIsWorkspaceInitializing(true);
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const wsList = (data || []) as Workspace[];
      setWorkspaces(wsList);

      // Restore active workspace from localStorage or use first
      let active = wsList[0] || null;
      if (typeof window !== 'undefined') {
        const storedId = localStorage.getItem(STORAGE_KEY);
        if (storedId) {
          const found = wsList.find(w => w.id === storedId);
          if (found) active = found;
        }
      }

      setActiveWs(active);
      if (active && typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, active.id);
      }
    } catch (err) {
      console.error('[Workspace] Failed to fetch:', err);
      setWorkspaces([]);
      setActiveWs(null);
    } finally {
      setIsWorkspaceInitializing(false);
    }
  }, [user, supabase]);

  const handleSetActiveWorkspace = (ws: Workspace) => {
    setActiveWs(ws);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, ws.id);
    }
  };

  const updateWorkspaceName = async (name: string) => {
    if (!activeWorkspace) return;
    const updated = { ...activeWorkspace, name };
    setActiveWs(updated);
    setWorkspaces(prev => prev.map(w => w.id === activeWorkspace.id ? updated : w));

    try {
      await supabase
        .from('workspaces')
        .update({ name })
        .eq('id', activeWorkspace.id);
    } catch (err) {
      console.error('[Workspace] Failed to update name:', err);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, [user, fetchWorkspaces]);

  return (
    <WorkspaceContext.Provider value={{
      activeWorkspace, workspaces, isWorkspaceInitializing,
      setActiveWorkspace: handleSetActiveWorkspace,
      refreshWorkspaces: fetchWorkspaces,
      updateWorkspaceName,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);
