'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Mail, Pause, Play, MoreHorizontal, Download, ShieldCheck, Clock3, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';
import { AppLayout } from '../../../../layouts/AppLayout';
import { useToast } from '../../../../contexts/ToastContext';

const client = {
  name: 'Northstar Studio',
  email: 'finance@northstar.studio',
  phone: '+1 (415) 555-0148',
  status: 'Healthy',
  outstanding: '$12,840',
  recovered: '$38,400',
  invoices: 4,
  lastPayment: 'Jan 18, 2025',
};

const invoices = [
  { id: 'INV-1048', amount: '$8,400', due: 'Jan 28, 2025', status: 'Chasing', tone: 'blue' },
  { id: 'INV-1039', amount: '$4,440', due: 'Jan 12, 2025', status: 'Chasing', tone: 'amber' },
  { id: 'INV-1021', amount: '$18,000', due: 'Dec 20, 2024', status: 'Paid', tone: 'green' },
];

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { addToast } = useToast();
  const [paused, setPaused] = useState(false);
  const [notes, setNotes] = useState('Northstar prefers payment reminders on weekday mornings.');

  const notify = (message: string) => addToast(message, 'success');

  return (
    <AppLayout title={client.name} subtitle="Client relationship workspace" backPath="/app/clients" actions={
      <button onClick={() => notify('Client report prepared')} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm hover:border-brand-blue hover:text-brand-blue">
        <Download className="h-4 w-4" /> Export report
      </button>
    }>
      <div className="space-y-6">
        <Link href="/app/clients" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-blue"><ArrowLeft className="h-4 w-4" /> Back to clients</Link>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-lg font-black text-brand-blue">NS</div><div><div className="flex flex-wrap items-center gap-3"><h2 className="font-heading text-2xl font-bold text-gray-900">{client.name}</h2><span className="rounded-full border border-emerald-100 bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">{client.status}</span></div><p className="mt-1 text-sm text-gray-500">{client.email} · {client.phone}</p><p className="mt-3 flex items-center gap-2 text-xs text-gray-400"><ShieldCheck className="h-4 w-4 text-astrix-teal" /> Payment information is protected and never stored by Astrix.</p></div></div>
            <div className="flex flex-wrap gap-2"><button onClick={() => notify(`Reminder email drafted for ${client.name}`)} className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white shadow-glow-blue"><Mail className="h-4 w-4" /> Draft email</button><button onClick={() => { setPaused(!paused); notify(paused ? 'Client reminders resumed' : 'Client reminders paused'); }} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-brand-blue">{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{paused ? 'Resume reminders' : 'Pause reminders'}</button><button onClick={() => notify('Client actions opened')} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"><MoreHorizontal className="h-4 w-4" /></button></div>
          </div>
          {paused && <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">All automated reminders for this client are paused. Existing payment links remain active.</div>}
        </section>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{[['Outstanding', client.outstanding, 'Needs attention'], ['Recovered', client.recovered, 'Lifetime collected'], ['Invoices', String(client.invoices), 'Across all statuses'], ['Last payment', client.lastPayment, 'Most recent activity']].map(([label, value, hint]) => <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p><p className="mt-3 font-heading text-2xl font-bold text-gray-900">{value}</p><p className="mt-1 text-xs text-gray-500">{hint}</p></div>)}</div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-gray-100 p-5"><div><h3 className="font-heading font-bold text-gray-900">Invoice history</h3><p className="text-xs text-gray-500">Every invoice and recovery touchpoint.</p></div><button onClick={() => notify('Invoice history exported')} className="text-xs font-bold text-brand-blue">Export</button></div><div className="divide-y divide-gray-100">{invoices.map((invoice) => <div key={invoice.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center"><div className="rounded-xl bg-gray-50 p-3 text-brand-blue"><FileText className="h-5 w-5" /></div><div className="flex-1"><Link href={`/app/invoices/${invoice.id}`} className="font-bold text-gray-900 hover:text-brand-blue">{invoice.id}</Link><p className="mt-1 text-xs text-gray-500">Due {invoice.due}</p></div><span className="font-bold text-gray-900">{invoice.amount}</span><span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${invoice.tone === 'green' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : invoice.tone === 'amber' ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-blue-100 bg-blue-50 text-blue-700'}`}>{invoice.status}</span></div>)}</div></section>
          <div className="space-y-6"><section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div><h3 className="font-heading font-bold text-gray-900">Relationship notes</h3><p className="text-xs text-gray-500">Private notes for your team.</p></div><button onClick={() => notify('Notes saved')} className="text-xs font-bold text-brand-blue">Save</button></div><textarea value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-4 min-h-28 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm leading-6 text-gray-700 outline-none focus:border-brand-blue" /></section><section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><h3 className="font-heading font-bold text-gray-900">Communication timeline</h3><div className="mt-4 space-y-4">{[['Reminder sent', 'Friendly nudge delivered', 'Today, 9:12 AM', Mail], ['Payment received', 'Invoice INV-1021 cleared', 'Jan 18, 2025', CheckCircle2], ['Invoice overdue', 'INV-1048 entered recovery', 'Jan 30, 2025', AlertTriangle]].map(([title, text, time, Icon]) => <div key={title as string} className="flex gap-3"><div className="rounded-lg bg-blue-50 p-2 text-brand-blue"><Icon className="h-4 w-4" /></div><div><p className="text-sm font-bold text-gray-800">{title as string}</p><p className="text-xs text-gray-500">{text as string}</p><p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400"><Clock3 className="h-3 w-3" />{time as string}</p></div></div>)}</div></section></div>
        </div>
      </div>
    </AppLayout>
  );
}

