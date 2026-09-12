'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowser } from './supabase-browser';
import {
  Invoice, GatewaySettings, ToneSettings, ActivityItem, AdminUser, GatewayType,
} from '../types';

// ─── Supabase client ────────────────────────────────────────────────────────
const supabase = getSupabaseBrowser();

// ─── Helpers ─────────────────────────────────────────────────────────────────
export const triggerUpdate = () => window.dispatchEvent(new Event('data-updated'));

// ─── Seed Data (kept for compatibility, now a no-op) ──────────────────────────
export const initializeWorkspace = (_workspaceId: string) => {
  // No-op — data now comes from Supabase
};

// ─── API ──────────────────────────────────────────────────────────────────────
export const api = {
  invoices: {
    list: async (wsId: string): Promise<Invoice[]> => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('workspace_id', wsId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapInvoice);
    },

    create: async (data: Omit<Invoice, 'id' | 'created_at' | 'ai_status' | 'last_chased_at' | 'reminder_count' | 'days_overdue'>): Promise<Invoice> => {
      const { data: result, error } = await supabase
        .from('invoices')
        .insert({
          workspace_id: data.workspace_id,
          client_name: data.client_name,
          client_email: data.client_email,
          amount: data.amount,
          currency: data.currency,
          due_date: data.due_date,
          status: data.status || 'pending',
        })
        .select()
        .single();
      if (error) throw error;

      // Log activity
      await supabase.from('activity_feed').insert({
        workspace_id: data.workspace_id,
        type: 'invoice_created',
        message: `New invoice added for ${data.client_name}`,
        amount: data.amount,
      });

      triggerUpdate();
      return mapInvoice(result);
    },

    update: async (id: string, data: Partial<Invoice>): Promise<void> => {
      const updateData: Record<string, unknown> = {};
      if (data.status !== undefined) updateData.status = data.status;
      if (data.ai_status !== undefined) updateData.ai_status = data.ai_status;
      if (data.last_chased_at !== undefined) updateData.last_chased_at = data.last_chased_at;
      if (data.reminder_count !== undefined) updateData.reminder_count = data.reminder_count;
      if (data.payment_link !== undefined) updateData.payment_link = data.payment_link;

      const { error } = await supabase.from('invoices').update(updateData).eq('id', id);
      if (error) throw error;
      triggerUpdate();
    },
  },

  gateways: {
    list: async (wsId: string): Promise<GatewaySettings[]> => {
      const { data, error } = await supabase
        .from('gateways')
        .select('*')
        .eq('workspace_id', wsId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map(mapGateway);
    },

    create: async (data: Omit<GatewaySettings, 'id' | 'created_at'>): Promise<GatewaySettings> => {
      // Use API route for encryption of API keys
      const res = await fetch('/api/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create gateway');
      }
      const result = await res.json();
      triggerUpdate();
      return mapGateway(result.gateway);
    },

    remove: async (id: string): Promise<void> => {
      const res = await fetch('/api/gateways', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error('Failed to remove gateway');
      triggerUpdate();
    },
  },

  tone: {
    get: async (wsId: string): Promise<ToneSettings | null> => {
      const { data, error } = await supabase
        .from('tone_settings')
        .select('*')
        .eq('workspace_id', wsId)
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (!data) return null;
      return {
        workspace_id: data.workspace_id,
        sample_emails: data.sample_emails || '',
        tone_level: data.tone_level || 2,
        ai_prompt: data.ai_prompt || '',
        updated_at: data.updated_at,
      };
    },

    save: async (data: ToneSettings): Promise<void> => {
      const { error } = await supabase
        .from('tone_settings')
        .upsert({
          workspace_id: data.workspace_id,
          sample_emails: data.sample_emails,
          tone_level: data.tone_level,
          ai_prompt: data.ai_prompt,
          updated_at: new Date().toISOString(),
        });
      if (error) throw error;
      triggerUpdate();
    },
  },

  activity: {
    list: async (): Promise<ActivityItem[]> => {
      const { data: ws } = await supabase
        .from('workspaces')
        .select('id')
        .limit(1)
        .single();
      if (!ws) return [];

      const { data, error } = await supabase
        .from('activity_feed')
        .select('*')
        .eq('workspace_id', ws.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []).map(mapActivity);
    },
  },

  admin: {
    listUsers: async (): Promise<AdminUser[]> => {
      // Use API route for admin queries (requires service role)
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      return data.users || [];
    },

    updateUser: async (id: string, data: Partial<AdminUser>): Promise<void> => {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error('Failed to update user');
      triggerUpdate();
    },

    addCredits: async (id: string, credits: number): Promise<void> => {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, credits_adjustment: credits }),
      });
      if (!res.ok) throw new Error('Failed to add credits');
      triggerUpdate();
    },
  },
};

// ─── Type Mappers ────────────────────────────────────────────────────────────
function mapInvoice(row: Record<string, unknown>): Invoice {
  const dueDate = new Date(row.due_date as string);
  const today = new Date();
  const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000));
  return {
    id: row.id as string,
    workspace_id: row.workspace_id as string,
    client_name: row.client_name as string,
    client_email: row.client_email as string,
    amount: Number(row.amount),
    currency: row.currency as string,
    due_date: row.due_date as string,
    status: row.status as Invoice['status'],
    ai_status: row.ai_status as Invoice['ai_status'],
    last_chased_at: row.last_chased_at as string | null,
    reminder_count: row.reminder_count as number,
    days_overdue,
    created_at: row.created_at as string,
  };
}

function mapGateway(row: Record<string, unknown>): GatewaySettings {
  return {
    id: row.id as string,
    workspace_id: row.workspace_id as string,
    type: row.type as GatewayType,
    label: row.label as string,
    api_key: row.api_key_enc ? '****' : undefined, // Never expose real key
    static_url: row.static_url as string | undefined,
    is_active: row.is_active as boolean,
    created_at: row.created_at as string,
  };
}

function mapActivity(row: Record<string, unknown>): ActivityItem {
  return {
    id: row.id as string,
    type: row.type as ActivityItem['type'],
    message: row.message as string,
    timestamp: row.created_at as string,
    amount: row.amount ? Number(row.amount) : undefined,
  };
}

// ─── React Hooks ──────────────────────────────────────────────────────────────
export function useQuery<T>(fetcher: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetcher();
      setData(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    execute();
    window.addEventListener('data-updated', execute);
    return () => window.removeEventListener('data-updated', execute);
  }, [execute]);

  return { data, isLoading, error, refetch: execute };
}

export const useInvoices = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return [];
    return api.invoices.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading, refetch };
};

export const useGateways = (wsId?: string) => {
  const { data, isLoading, refetch } = useQuery(async () => {
    if (!wsId) return [];
    return api.gateways.list(wsId);
  }, [wsId]);
  return { data: data || [], isLoading, refetch };
};

export const useToneSettings = (wsId?: string) => {
  const { data, isLoading } = useQuery(async () => {
    if (!wsId) return null;
    return api.tone.get(wsId);
  }, [wsId]);
  return { data, isLoading };
};

export const useActivity = () => {
  const { data, isLoading } = useQuery(async () => api.activity.list(), []);
  return { data: data || [], isLoading };
};

export const useAdminUsers = () => {
  const { data, isLoading, refetch } = useQuery(async () => api.admin.listUsers(), []);
  return { data: data || [], isLoading, refetch };
};

// ─── Legacy hooks (return empty — old product intelligence features) ──────────
export const useAccounts = (_wsId?: string) => ({ data: [], isLoading: false });
export const useAccount = (_id?: string) => ({ data: null, isLoading: false });
export const useSignals = (_wsId?: string) => ({ data: [], isLoading: false });
export const useProblems = (_wsId?: string) => ({ data: [], isLoading: false, refetch: async () => {} });
export const useProblem = (_id?: string) => ({ data: null, isLoading: false });
export const useOpportunities = (_wsId?: string) => ({ data: [], isLoading: false, refetch: async () => {} });
export const useOpportunity = (_id?: string) => ({ data: null, isLoading: false });
export const useDecisions = (_wsId?: string) => ({ data: [], isLoading: false });
export const useDecision = (_id?: string) => ({ data: null, isLoading: false });
export const useArtifacts = (_wsId?: string) => ({ data: [], isLoading: false, refetch: async () => {} });
export const useArtifact = (_id?: string) => ({ data: null, isLoading: false });
export const useLaunches = (_wsId?: string) => ({ data: [], isLoading: false });
