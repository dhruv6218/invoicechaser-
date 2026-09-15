'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type Invoice = {
  invoice_id: string;
  client_name: string;
  client_email: string;
  amount: number;
  currency: string;
  due_date: string;
  status: 'pending' | 'paid' | 'paused' | 'disputed';
  last_chased_at?: string;
};

export default function DashboardPage() {
  const { user, isInitializing } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isInitializing) return;
    if (!user) return;

    const fetchInvoices = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true });

      if (!error) setInvoices(data || []);
      setLoading(false);
    };

    fetchInvoices();

    const channel = supabase
      .channel('invoices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices', filter: `user_id=eq.${user.id}` }, () => fetchInvoices())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isInitializing]);

  if (isInitializing || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Please sign in to view dashboard.</div>;
  }

  const totalRecovered = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount), 0);
  const outstanding = invoices.filter(i => i.status === 'pending').reduce((s, i) => s + Number(i.amount), 0);
  const activeChases = invoices.filter(i => i.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Signed in as {user.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <MetricCard label="Total Recovered" value={`$${totalRecovered.toLocaleString()}`} />
          <MetricCard label="Outstanding" value={`$${outstanding.toLocaleString()}`} />
          <MetricCard label="Active Chases" value={String(activeChases)} />
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Overdue Invoices</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-6">Client</th>
                  <th className="text-left py-3 px-6">Amount</th>
                  <th className="text-left py-3 px-6">Due Date</th>
                  <th className="text-left py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.invoice_id} className="border-b">
                    <td className="py-3 px-6">{inv.client_name}</td>
                    <td className="py-3 px-6">${inv.amount}</td>
                    <td className="py-3 px-6">{inv.due_date}</td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded text-xs ${
                        inv.status === 'paid' ? 'bg-green-100 text-green-800' :
                        inv.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>{inv.status}</span>
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">No invoices yet. Add your first invoice.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    </div>
  );
}
