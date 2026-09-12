'use client';

import React, { useMemo, useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { BarChart3, TrendingUp, DollarSign, Clock, Download, CalendarDays, Users, ArrowUpRight, Filter } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useInvoices } from '../../lib/api';
import { Skeleton } from '../../components/ui/Skeleton';

const formatCurrency = (value: number, currency = 'USD') => {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}k`;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
};

export const Analytics = () => {
  const { activeWorkspace } = useWorkspace();
  const { data: invoices, isLoading } = useInvoices(activeWorkspace?.id);
  const { addToast } = useToast();
  const [range, setRange] = useState('Last 6 months');
  const [showFilters, setShowFilters] = useState(false);
  const [metric, setMetric] = useState('Recovery rate');

  const stats = useMemo(() => {
    if (!invoices || invoices.length === 0) {
      return {
        totalRecovered: 0,
        recoveryRate: 0,
        avgDaysToPayment: 0,
        clientsRecovered: 0,
        outstanding: 0,
        monthlyData: [] as { month: string; rate: number }[],
        clientPerf: [] as { name: string; recovered: number; rate: number; days: number; status: string }[],
      };
    }

    const paid = invoices.filter(i => i.status === 'paid');
    const pending = invoices.filter(i => i.status === 'pending');
    const totalRecovered = paid.reduce((s, i) => s + i.amount, 0);
    const outstanding = pending.reduce((s, i) => s + i.amount, 0);
    const recoveryRate = invoices.length > 0 ? Math.round((paid.length / invoices.length) * 100) : 0;

    // Avg days to payment (from created_at to last_chased_at or now)
    const paidWithDays = paid.map(i => {
      const created = new Date(i.created_at).getTime();
      const paid = i.last_chased_at ? new Date(i.last_chased_at).getTime() : Date.now();
      return Math.max(0, Math.floor((paid - created) / 86400000));
    });
    const avgDays = paidWithDays.length > 0 ? Math.round(paidWithDays.reduce((a, b) => a + b, 0) / paidWithDays.length) : 0;

    // Unique clients recovered
    const uniqueClients = new Set(paid.map(i => i.client_email)).size;

    // Monthly recovery rate (last 6 months)
    const now = new Date();
    const monthlyData: { month: string; rate: number }[] = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const monthInvoices = invoices.filter(i => {
        const id = new Date(i.created_at);
        return id.getMonth() === d.getMonth() && id.getFullYear() === d.getFullYear();
      });
      const monthPaid = monthInvoices.filter(i => i.status === 'paid');
      const rate = monthInvoices.length > 0 ? Math.round((monthPaid.length / monthInvoices.length) * 100) : 0;
      monthlyData.push({ month: d.toLocaleDateString('en-US', { month: 'short' }), rate });
    }

    // Client performance (group by client_email)
    const clientMap: Record<string, { name: string; total: number; paid: number; count: number; paidCount: number; days: number[] }> = {};
    invoices.forEach(i => {
      const key = i.client_email || i.client_name;
      if (!clientMap[key]) {
        clientMap[key] = { name: i.client_name, total: 0, paid: 0, count: 0, paidCount: 0, days: [] };
      }
      clientMap[key].total += i.amount;
      clientMap[key].count++;
      if (i.status === 'paid') {
        clientMap[key].paid += i.amount;
        clientMap[key].paidCount++;
        if (i.last_chased_at) {
          const days = Math.floor((new Date(i.last_chased_at).getTime() - new Date(i.created_at).getTime()) / 86400000);
          clientMap[key].days.push(Math.max(0, days));
        }
      }
    });

    const clientPerf = Object.values(clientMap).map(c => {
      const rate = c.count > 0 ? Math.round((c.paidCount / c.count) * 100) : 0;
      const avgDays = c.days.length > 0 ? Math.round(c.days.reduce((a, b) => a + b, 0) / c.days.length) : 0;
      const status = rate >= 90 ? 'Healthy' : rate >= 70 ? 'Healthy' : 'At risk';
      return { name: c.name, recovered: c.paid, rate, days: avgDays, status };
    }).sort((a, b) => b.recovered - a.recovered).slice(0, 10);

    return {
      totalRecovered,
      recoveryRate,
      avgDaysToPayment: avgDays,
      clientsRecovered: uniqueClients,
      outstanding,
      monthlyData,
      clientPerf,
    };
  }, [invoices]);

  const exportReport = () => {
    if (!invoices || invoices.length === 0) {
      addToast('No data to export', 'warning');
      return;
    }
    // Export as CSV
    const headers = ['Client Name', 'Client Email', 'Amount', 'Currency', 'Due Date', 'Status', 'AI Status', 'Reminders', 'Created At'];
    const rows = invoices.map(i => [
      i.client_name, i.client_email, i.amount, i.currency, i.due_date, i.status, i.ai_status, i.reminder_count, i.created_at,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'astrix-analytics.csv';
    a.click();
    URL.revokeObjectURL(url);
    addToast('Analytics report exported as CSV', 'success');
  };

  if (isLoading) {
    return (
      <AppLayout title="Analytics" subtitle="Recovery performance and trends">
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <Skeleton className="h-80 rounded-2xl lg:col-span-3" />
            <Skeleton className="h-80 rounded-2xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  const KPI_CARDS: Array<{ label: string; value: string; change: string; Icon: LucideIcon; color: string }> = [
    { label: 'Recovered', value: formatCurrency(stats.totalRecovered), change: `${invoices?.filter(i => i.status === 'paid').length || 0} invoices`, Icon: DollarSign, color: 'text-green-600 bg-green-50' },
    { label: 'Recovery rate', value: `${stats.recoveryRate}%`, change: `${invoices?.filter(i => i.status === 'paid').length || 0}/${invoices?.length || 0} cleared`, Icon: TrendingUp, color: 'text-brand-blue bg-blue-50' },
    { label: 'Avg. time to payment', value: stats.avgDaysToPayment > 0 ? `${stats.avgDaysToPayment} days` : '—', change: 'Across paid invoices', Icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: 'Clients recovered', value: String(stats.clientsRecovered), change: 'Unique clients', Icon: Users, color: 'text-purple-600 bg-purple-50' },
  ];

  return (
    <AppLayout title="Analytics" subtitle="Recovery performance and trends">
      <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Reporting period</p>
            <p className="mt-1 text-sm font-bold text-gray-900">Track the impact of automated recovery</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['Last 30 days', 'Last 6 months', 'This year'].map((item) => (
              <button key={item} onClick={() => setRange(item)} className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${range === item ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>{item}</button>
            ))}
            <button onClick={() => setShowFilters(!showFilters)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"><Filter className="h-3.5 w-3.5" /> Filters</button>
            <button onClick={exportReport} className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"><Download className="h-3.5 w-3.5" /> Export</button>
          </div>
        </div>

        {showFilters && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm">
            <CalendarDays className="h-4 w-4 text-brand-blue" />
            <span className="font-bold text-gray-700">Showing {range.toLowerCase()}</span>
            <select value={metric} onChange={(e) => setMetric(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none">
              <option>Recovery rate</option>
              <option>Recovered amount</option>
              <option>Time to payment</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPI_CARDS.map(({ label, value, change, Icon, color }) => (
            <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className={`flex size-9 items-center justify-center rounded-xl ${color.split(' ')[1]}`}>
                  <Icon className={`h-4 w-4 ${color.split(' ')[0]}`} />
                </div>
                <span className="text-xs font-bold text-gray-400">{change}</span>
              </div>
              <p className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
              <p className="mt-1 font-heading text-2xl font-black text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Recovery trend */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-heading text-lg font-bold text-gray-900">Recovery trend</h2>
                <p className="mt-1 text-sm text-gray-500">Percentage of invoices recovered by month</p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                <ArrowUpRight className="h-3.5 w-3.5" /> {stats.recoveryRate}%
              </span>
            </div>
            <div className="mt-8 flex h-56 items-end gap-3 border-b border-gray-100 px-2 sm:gap-6">
              {stats.monthlyData.length > 0 ? stats.monthlyData.map((d, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                  <div className="relative flex w-full max-w-12 items-end rounded-t-lg bg-blue-50" style={{ height: `${Math.max(d.rate, 5)}%` }}>
                    <div className="w-full rounded-t-lg bg-brand-blue transition-all hover:bg-blue-700" style={{ height: `${Math.min(d.rate + 4, 100)}%` }} title={`${d.rate}% recovered`} />
                  </div>
                  <span className="text-xs font-bold text-gray-400">{d.month}</span>
                </div>
              )) : (
                <div className="flex-1 flex items-center justify-center text-sm text-gray-400">No data yet</div>
              )}
            </div>
          </section>

          {/* Collection mix */}
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="font-heading text-lg font-bold text-gray-900">Outstanding vs Recovered</h2>
            <p className="mt-1 text-sm text-gray-500">Current recovery status breakdown</p>
            <div className="mt-8 flex items-center gap-8">
              <div className="relative flex size-36 shrink-0 items-center justify-center rounded-full" style={{
                background: `conic-gradient(#0f9f9a 0 ${stats.recoveryRate}%, #e5e7eb ${stats.recoveryRate}% 100%)`
              }}>
                <div className="flex size-24 flex-col items-center justify-center rounded-full bg-white">
                  <span className="font-heading text-2xl font-black text-gray-900">{stats.recoveryRate}%</span>
                  <span className="text-[10px] font-bold text-gray-400">recovered</span>
                </div>
              </div>
              <div className="flex flex-col gap-3 text-xs font-bold text-gray-600">
                <span><i className="mr-2 inline-block size-2 rounded-full bg-astrix-teal" /> Recovered: {formatCurrency(stats.totalRecovered)}</span>
                <span><i className="mr-2 inline-block size-2 rounded-full bg-gray-300" /> Outstanding: {formatCurrency(stats.outstanding)}</span>
              </div>
            </div>
          </section>
        </div>

        {/* Client performance */}
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
            <div>
              <h2 className="font-heading text-lg font-bold text-gray-900">Client performance</h2>
              <p className="mt-1 text-sm text-gray-500">Payment behavior across your client base</p>
            </div>
          </div>
          {stats.clientPerf.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left">
                <thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">Recovered</th>
                    <th className="px-6 py-3">Recovery rate</th>
                    <th className="px-6 py-3">Avg. payment</th>
                    <th className="px-6 py-3">Health</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats.clientPerf.map((client) => (
                    <tr key={client.name} className="text-sm hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-900">{client.name}</td>
                      <td className="px-6 py-4 font-bold text-gray-700">{formatCurrency(client.recovered)}</td>
                      <td className="px-6 py-4 font-bold text-astrix-teal">{client.rate}%</td>
                      <td className="px-6 py-4 text-gray-600">{client.days > 0 ? `${client.days} days` : '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${client.status === 'At risk' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                          {client.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BarChart3 className="w-12 h-12 text-gray-300 mb-4" />
              <p className="text-sm font-bold text-gray-600">No client data yet</p>
              <p className="text-xs text-gray-400 mt-1">Add invoices to see client performance analytics.</p>
            </div>
          )}
        </section>
      </div>
    </AppLayout>
  );
};

export default Analytics;
