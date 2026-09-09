'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppLayout } from '../../layouts/AppLayout';
import { useToast } from '../../contexts/ToastContext';
import { ArrowLeft, Bell, CheckCircle2, Copy, Download, Mail, MoreHorizontal, Pause, Play, Send, ShieldCheck, UserRound } from 'lucide-react';

const events = [
  { date: 'Today, 9:42 AM', title: 'Friendly reminder scheduled', text: 'Astrix will send the next nudge if payment is not received.', tone: 'blue' },
  { date: 'Yesterday, 2:15 PM', title: 'Reminder opened', text: 'Northstar Studio opened the reminder email.', tone: 'green' },
  { date: 'Mar 12, 10:08 AM', title: 'Reminder sent', text: 'Friendly nudge with payment link sent to finance@northstar.studio.', tone: 'gray' },
];

export default function InvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const { addToast } = useToast();
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState('Chasing');
  const [showMenu, setShowMenu] = useState(false);
  const id = decodeURIComponent(invoiceId || 'INV-1048');
  const notify = (message: string) => addToast(message, 'success');

  return (
    <AppLayout title={id} subtitle="Invoice recovery workspace" backPath="/app/invoices" actions={<button onClick={() => notify('Reminder queued for sending')} className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white shadow-glow-blue"><Send className="h-4 w-4" /> Send reminder</button>}>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/app/invoices" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900"><ArrowLeft className="h-4 w-4" /> Back to invoices</Link>
          <div className="relative"><button onClick={() => setShowMenu((value) => !value)} className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50" aria-label="Invoice actions"><MoreHorizontal className="h-5 w-5" /></button>{showMenu && <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-gray-200 bg-white p-1 shadow-xl"><button onClick={() => notify('Invoice download prepared')} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50">Download PDF</button><button onClick={() => notify('Invoice marked as disputed')} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50">Mark disputed</button><button onClick={() => notify('Invoice archived')} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50">Archive invoice</button></div>}</div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-brand-blue">Outstanding invoice</p><h2 className="mt-2 font-heading text-3xl font-bold text-gray-900">{id}</h2><p className="mt-1 text-sm text-gray-500">Issued Mar 04, 2026 · Due Mar 12, 2026</p></div><span className="rounded-full border border-amber-100 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">{status}</span></div>
              <div className="mt-8 grid gap-5 border-y border-gray-100 py-6 sm:grid-cols-3"><div><p className="text-xs text-gray-400">Amount due</p><p className="mt-1 font-heading text-3xl font-bold text-gray-900">$8,400.00</p></div><div><p className="text-xs text-gray-400">Days overdue</p><p className="mt-1 text-xl font-bold text-amber-600">2 days</p></div><div><p className="text-xs text-gray-400">Next reminder</p><p className="mt-1 text-sm font-bold text-gray-900">Tomorrow, 9:00 AM</p></div></div>
              <div className="mt-6 flex flex-wrap gap-3"><button onClick={() => { setPaused((value) => !value); notify(paused ? 'AI chasing resumed' : 'AI chasing paused'); }} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">{paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}{paused ? 'Resume AI chasing' : 'Pause AI chasing'}</button><button onClick={() => { setStatus('Paid'); notify('Invoice marked as paid'); }} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4" /> Mark as paid</button></div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"><div className="flex items-center justify-between"><div><h2 className="font-heading text-lg font-bold text-gray-900">Recovery timeline</h2><p className="mt-1 text-sm text-gray-500">Every touchpoint, in one place.</p></div><Bell className="h-5 w-5 text-gray-400" /></div><div className="mt-6 flex flex-col gap-6">{events.map((event) => <div key={event.date} className="flex gap-4"><div className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ${event.tone === 'green' ? 'bg-emerald-50 text-emerald-600' : event.tone === 'blue' ? 'bg-blue-50 text-brand-blue' : 'bg-gray-100 text-gray-500'}`}><Mail className="h-4 w-4" /></div><div><p className="text-xs font-bold uppercase tracking-wide text-gray-400">{event.date}</p><p className="mt-1 font-bold text-gray-900">{event.title}</p><p className="mt-1 text-sm leading-6 text-gray-500">{event.text}</p></div></div>)}</div></section>
          </div>

          <aside className="space-y-6"><section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-brand-blue/10 text-sm font-bold text-brand-blue">NS</div><div><p className="font-bold text-gray-900">Northstar Studio</p><p className="text-xs text-gray-500">finance@northstar.studio</p></div></div><div className="mt-6 flex flex-col gap-3 text-sm"><div className="flex items-center justify-between"><span className="text-gray-500">Client status</span><span className="font-bold text-emerald-600">Healthy</span></div><div className="flex items-center justify-between"><span className="text-gray-500">Open invoices</span><span className="font-bold text-gray-900">4</span></div><Link href="/app/clients" className="mt-2 inline-flex items-center gap-2 font-bold text-brand-blue">View client profile <UserRound className="h-4 w-4" /></Link></div></section><section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"><h2 className="font-heading font-bold text-gray-900">Payment link</h2><p className="mt-1 text-xs leading-5 text-gray-500">Share a secure link with your client.</p><div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 p-3"><span className="min-w-0 flex-1 truncate text-xs text-gray-500">astrix.ai/pay/{id}</span><button onClick={() => { navigator.clipboard?.writeText(`https://astrix.ai/pay/${id}`); notify('Payment link copied'); }} className="rounded-lg p-2 text-brand-blue hover:bg-white" aria-label="Copy payment link"><Copy className="h-4 w-4" /></button></div><Link href={`/pay/${id}`} target="_blank" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"><ShieldCheck className="h-4 w-4 text-emerald-600" /> Preview payment portal</Link></section><button onClick={() => notify('Invoice PDF download prepared')} className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"><Download className="h-4 w-4" /> Download invoice</button></aside>
        </div>
      </div>
    </AppLayout>
  );
}
