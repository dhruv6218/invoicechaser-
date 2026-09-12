'use client';

import React, { useMemo, useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { BarChart3, TrendingUp, DollarSign, Clock, Download, CalendarDays, Users, ArrowUpRight, Filter } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const MONTHS = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
const RECOVERY = [52, 61, 58, 74, 81, 94];
const CLIENTS = [
  { name: 'Northstar Studio', recovered: '$18,420', rate: '98%', days: '12 days', tone: 'Excellent' },
  { name: 'Acme Corp', recovered: '$12,800', rate: '94%', days: '18 days', tone: 'Healthy' },
  { name: 'InnovateLab', recovered: '$9,650', rate: '91%', days: '21 days', tone: 'Healthy' },
  { name: 'TechStart GmbH', recovered: '$6,330', rate: '82%', days: '29 days', tone: 'At risk' },
];

const KPI_CARDS: Array<{ label: string; value: string; change: string; Icon: LucideIcon; color: string }> = [
  { label: 'Recovered', value: '$47,200', change: '+18.4%', Icon: DollarSign, color: 'text-green-600 bg-green-50' },
  { label: 'Recovery rate', value: '94%', change: '+6.2%', Icon: TrendingUp, color: 'text-brand-blue bg-blue-50' },
  { label: 'Avg. time to payment', value: '18.6 days', change: '-4.8 days', Icon: Clock, color: 'text-amber-600 bg-amber-50' },
  { label: 'Clients recovered', value: '28', change: '+12 this period', Icon: Users, color: 'text-purple-600 bg-purple-50' },
];

export const Analytics = () => {
  const { addToast } = useToast();
  const [range, setRange] = useState('Last 6 months');
  const [showFilters, setShowFilters] = useState(false);
  const [metric, setMetric] = useState('Recovery rate');

  const total = useMemo(() => range === 'This year' ? '$72,460' : range === 'Last 30 days' ? '$12,400' : '$47,200', [range]);
  const exportReport = () => addToast('Analytics report exported as CSV', 'success');

  return (
    <AppLayout title="Analytics" subtitle="Recovery performance and trends">
      <div className="flex flex-col gap-6 animate-[fadeIn_0.3s_ease-out]">
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div><p className="text-xs font-bold uppercase tracking-widest text-gray-400">Reporting period</p><p className="mt-1 text-sm font-bold text-gray-900">Track the impact of automated recovery</p></div>
          <div className="flex flex-wrap gap-2">
            {['Last 30 days', 'Last 6 months', 'This year'].map((item) => <button key={item} onClick={() => setRange(item)} className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${range === item ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>{item}</button>)}
            <button onClick={() => setShowFilters((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50"><Filter className="h-3.5 w-3.5" /> Filters</button>
            <button onClick={exportReport} className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white hover:bg-blue-700"><Download className="h-3.5 w-3.5" /> Export</button>
          </div>
        </div>
        {showFilters && <div className="flex flex-wrap items-center gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 text-sm"><CalendarDays className="h-4 w-4 text-brand-blue" /><span className="font-bold text-gray-700">Showing {range.toLowerCase()}</span><select value={metric} onChange={(event) => setMetric(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 outline-none"><option>Recovery rate</option><option>Recovered amount</option><option>Time to payment</option></select></div>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KPI_CARDS.map(({ label, value: defaultValue, change, Icon, color }) => <div key={String(label)} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div className={`flex size-9 items-center justify-center rounded-xl ${String(color).split(' ')[1]}`}><Icon className={`h-4 w-4 ${String(color).split(' ')[0]}`} /></div><span className="text-xs font-bold text-green-600">{change}</span></div><p className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p><p className="mt-1 font-heading text-2xl font-black text-gray-900">{label === 'Recovered' ? total : defaultValue}</p></div>)}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-3"><div className="flex items-start justify-between"><div><h2 className="font-heading text-lg font-bold text-gray-900">Recovery trend</h2><p className="mt-1 text-sm text-gray-500">Percentage of invoices recovered by month</p></div><span className="inline-flex items-center gap-1 text-xs font-bold text-green-600"><ArrowUpRight className="h-3.5 w-3.5" /> +18.4%</span></div><div className="mt-8 flex h-56 items-end gap-3 border-b border-gray-100 px-2 sm:gap-6">{RECOVERY.map((value, index) => <div key={MONTHS[index]} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="relative flex w-full max-w-12 items-end rounded-t-lg bg-blue-50" style={{ height: `${value}%` }}><div className="w-full rounded-t-lg bg-brand-blue transition-all hover:bg-blue-700" style={{ height: `${Math.min(value + 4, 100)}%` }} title={`${value}% recovered`} /></div><span className="text-xs font-bold text-gray-400">{MONTHS[index]}</span></div>)}</div></section>
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2"><h2 className="font-heading text-lg font-bold text-gray-900">Collection mix</h2><p className="mt-1 text-sm text-gray-500">Where recovered revenue came from</p><div className="mt-8 flex items-center gap-8"><div className="relative flex size-36 shrink-0 items-center justify-center rounded-full" style={{ background: 'conic-gradient(#0f9f9a 0 52%, #2563eb 52% 78%, #f59e0b 78% 94%, #e5e7eb 94% 100%)' }}><div className="flex size-24 flex-col items-center justify-center rounded-full bg-white"><span className="font-heading text-2xl font-black text-gray-900">$47k</span><span className="text-[10px] font-bold text-gray-400">recovered</span></div></div><div className="flex flex-col gap-3 text-xs font-bold text-gray-600"><span><i className="mr-2 inline-block size-2 rounded-full bg-astrix-teal" />AI reminders 52%</span><span><i className="mr-2 inline-block size-2 rounded-full bg-brand-blue" />Payment links 26%</span><span><i className="mr-2 inline-block size-2 rounded-full bg-amber-500" />Manual follow-up 16%</span></div></div></section>
        </div>

        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-gray-100 px-6 py-5"><div><h2 className="font-heading text-lg font-bold text-gray-900">Client performance</h2><p className="mt-1 text-sm text-gray-500">Payment behavior across your client base</p></div><button onClick={() => addToast('Client performance details opened', 'success')} className="text-xs font-bold text-brand-blue hover:text-blue-700">View full report</button></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead className="bg-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400"><tr><th className="px-6 py-3">Client</th><th className="px-6 py-3">Recovered</th><th className="px-6 py-3">Recovery rate</th><th className="px-6 py-3">Avg. payment</th><th className="px-6 py-3">Health</th></tr></thead><tbody className="divide-y divide-gray-100">{CLIENTS.map((client) => <tr key={client.name} className="text-sm hover:bg-gray-50"><td className="px-6 py-4 font-bold text-gray-900">{client.name}</td><td className="px-6 py-4 font-bold text-gray-700">{client.recovered}</td><td className="px-6 py-4 font-bold text-astrix-teal">{client.rate}</td><td className="px-6 py-4 text-gray-600">{client.days}</td><td className="px-6 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${client.tone === 'At risk' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>{client.tone}</span></td></tr>)}</tbody></table></div></section>
      </div>
    </AppLayout>
  );
};

export default Analytics;
