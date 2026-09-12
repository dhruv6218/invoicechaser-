'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Mail, Pause, Play, MoreHorizontal, Download, ShieldCheck, Clock3, CheckCircle2, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { AppLayout } from '../../../../layouts/AppLayout';
import { useToast } from '../../../../contexts/ToastContext';
import { useWorkspace } from '../../../../contexts/WorkspaceContext';
import { useInvoices } from '../../../../lib/api';

const formatCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

// Reverse slugify: "northstar-studio" → "Northstar Studio"
const deslug = (slug: string) =>
  slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

export default function ClientDetailPage() {
  const { clientId } = useParams<{ clientId: string }>();
  const { activeWorkspace } = useWorkspace();
  const { data: invoices, isLoading } = useInvoices(activeWorkspace?.id);
  const { addToast } = useToast();
  const [paused, setPaused] = useState(false);
  const [notes, setNotes] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  const clientName = deslug(decodeURIComponent(clientId || ''));

  // Filter invoices for this client
  const clientInvoices = useMemo(() => {
    if (!invoices) return [];
    return invoices.filter(inv =>
      inv.client_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') === clientId ||
      inv.client_name.toLowerCase() === clientName.toLowerCase()
    );
  }, [invoices, clientId, clientName]);

  const clientStats = useMemo(() => {
    if (clientInvoices.length === 0) {
      return { outstanding: 0, recovered: 0, total: 0, lastPayment: null, status: 'New' };
    }
    const paid = clientInvoices.filter(i => i.status === 'paid');
    const outstanding = clientInvoices.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0);
    const recovered = paid.reduce((s, i) => s + i.amount, 0);
    const lastPayment = paid.length > 0
      ? paid.map(i => i.last_chased_at).filter(Boolean).sort().reverse()[0]
      : null;
    const status = outstanding === 0 ? 'Healthy' : outstanding > 5000 ? 'At risk' : 'Healthy';
    return { outstanding, recovered, total: clientInvoices.length, lastPayment, status };
  }, [clientInvoices]);

  const notify = (message: string) => addToast(message, 'success');

  const saveNotes = () => {
    setNotesSaving(true);
    // Store notes in localStorage keyed by clientId
    if (typeof window !== 'undefined') {
      localStorage.setItem(`client_notes_${clientId}`, notes);
    }
    setTimeout(() => { setNotesSaving(false); notify('Notes saved'); }, 300);
  };

  // Load notes from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setNotes(localStorage.getItem(`client_notes_${clientId}`) || '');
    }
  }, [clientId]);

  if (isLoading) {
    return (
      <AppLayout title="Loading..." subtitle="" backPath="/app/clients">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      </AppLayout>
    );
  }

  if (clientInvoices.length === 0) {
    return (
      <AppLayout title={clientName} subtitle="Client relationship workspace" backPath="/app/clients">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertTriangle className="w-12 h-12 text-gray-300 mb-4" />
          <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">No invoices found for {clientName}</h3>
          <p className="text-sm text-gray-500 mb-6">This client may not have any invoices yet.</p>
          <Link href="/app/clients" className="bg-brand-blue text-white px-5 py-2.5 rounded-xl font-bold text-sm">Back to clients</Link>
        </div>
      </AppLayout>
    );
  }

  const clientEmail = clientInvoices[0]?.client_email || '';
  const initials = clientName.slice(0, 2).toUpperCase();

  return (
    <AppLayout title={clientName} subtitle="Client relationship workspace" backPath="/app/clients" actions={
      <button onClick={() => notify('Client report prepared')} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-sm hover:border-brand-blue hover:text-brand-blue">
        <Download className="h-4 w-4" /> Export report
      </button>
    }>
      <div className="space-y-6">
        <Link href="/app/clients" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-blue">
          <ArrowLeft className="h-4 w-4" /> Back to clients
        </Link>

        {/* Client header */}
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-blue/10 text-lg font-black text-brand-blue">{initials}</div>
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-heading text-2xl font-bold text-gray-900">{clientName}</h2>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                    clientStats.status === 'Healthy' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-amber-100 bg-amber-50 text-amber-700'
                  }`}>{clientStats.status}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{clientEmail}</p>
                <p className="mt-3 flex items-center gap-2 text-xs text-gray-400">
                  <ShieldCheck className="h-4 w-4 text-astrix-teal" /> Payment information is protected and never stored by Astrix.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => notify(`Reminder email drafted for ${clientName}`)} className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white shadow-glow-blue">
                <Mail className="h-4 w-4" /> Draft email
              </button>
              <button onClick={() => { setPaused(!paused); notify(paused ? 'Client reminders resumed' : 'Client reminders paused'); }} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:border-brand-blue">
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {paused ? 'Resume reminders' : 'Pause reminders'}
              </button>
            </div>
          </div>
          {paused && (
            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
              All automated reminders for this client are paused. Existing payment links remain active.
            </div>
          )}
        </section>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Outstanding', value: formatCurrency(clientStats.outstanding), hint: 'Needs attention' },
            { label: 'Recovered', value: formatCurrency(clientStats.recovered), hint: 'Lifetime collected' },
            { label: 'Invoices', value: String(clientStats.total), hint: 'Across all statuses' },
            { label: 'Last payment', value: clientStats.lastPayment ? formatDate(clientStats.lastPayment) : '—', hint: 'Most recent activity' },
          ].map(({ label, value, hint }) => (
            <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
              <p className="mt-3 font-heading text-2xl font-bold text-gray-900">{value}</p>
              <p className="mt-1 text-xs text-gray-500">{hint}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
          {/* Invoice history */}
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 p-5">
              <div>
                <h3 className="font-heading font-bold text-gray-900">Invoice history</h3>
                <p className="text-xs text-gray-500">Every invoice and recovery touchpoint.</p>
              </div>
              <button onClick={() => notify('Invoice history exported')} className="text-xs font-bold text-brand-blue">Export</button>
            </div>
            <div className="divide-y divide-gray-100">
              {clientInvoices.map((inv) => (
                <div key={inv.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center">
                  <div className="rounded-xl bg-gray-50 p-3 text-brand-blue"><FileText className="h-5 w-5" /></div>
                  <div className="flex-1">
                    <Link href={`/app/invoices/${inv.id}`} className="font-bold text-gray-900 hover:text-brand-blue">#{inv.id.slice(0, 8)}</Link>
                    <p className="mt-1 text-xs text-gray-500">Due {formatDate(inv.due_date)}</p>
                  </div>
                  <span className="font-bold text-gray-900">{formatCurrency(inv.amount, inv.currency)}</span>
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                    inv.status === 'paid' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' :
                    inv.status === 'paused' ? 'border-gray-100 bg-gray-50 text-gray-600' :
                    inv.status === 'disputed' ? 'border-orange-100 bg-orange-50 text-orange-700' :
                    inv.ai_status === 'escalated' ? 'border-amber-100 bg-amber-50 text-amber-700' :
                    'border-blue-100 bg-blue-50 text-blue-700'
                  }`}>
                    {inv.status === 'paid' ? 'Paid' :
                     inv.status === 'paused' ? 'Paused' :
                     inv.status === 'disputed' ? 'Disputed' :
                     inv.ai_status === 'nudge_sent' ? 'Nudge sent' :
                     inv.ai_status === 'escalated' ? 'Escalated' : 'Queued'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Sidebar */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-bold text-gray-900">Relationship notes</h3>
                  <p className="text-xs text-gray-500">Private notes for your team.</p>
                </div>
                <button onClick={saveNotes} disabled={notesSaving} className="text-xs font-bold text-brand-blue disabled:opacity-50">
                  {notesSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this client..."
                className="mt-4 min-h-28 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm leading-6 text-gray-700 outline-none focus:border-brand-blue"
              />
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="font-heading font-bold text-gray-900">Communication timeline</h3>
              <div className="mt-4 space-y-4">
                {clientInvoices.filter(i => i.last_chased_at).slice(0, 3).map((inv) => (
                  <div key={inv.id} className="flex gap-3">
                    <div className="rounded-lg bg-blue-50 p-2 text-brand-blue">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Reminder sent to {inv.client_name}</p>
                      <p className="text-xs text-gray-500">#{inv.id.slice(0, 8)} · {inv.reminder_count} reminder(s)</p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock3 className="h-3 w-3" /> {formatDate(inv.last_chased_at!)}
                      </p>
                    </div>
                  </div>
                ))}
                {clientInvoices.filter(i => i.last_chased_at).length === 0 && (
                  <div className="flex flex-col items-center py-6 text-center">
                    <Clock3 className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-xs text-gray-400">No reminders sent yet</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
