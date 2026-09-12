'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '../../layouts/AppLayout';
import { useToast } from '../../contexts/ToastContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { api } from '../../lib/api';
import { ArrowLeft, Bell, CheckCircle2, Copy, Download, Mail, MoreHorizontal, Pause, Play, Send, ShieldCheck, UserRound, Clock, AlertCircle, Loader2 } from 'lucide-react';

const formatCurrency = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export default function InvoiceDetail({ invoiceId }: { invoiceId: string }) {
  const { addToast } = useToast();
  const { activeWorkspace } = useWorkspace();
  const [invoice, setInvoice] = useState<any>(null);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [status, setStatus] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const id = decodeURIComponent(invoiceId);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.invoice) {
          setInvoice(data.invoice);
          setReminders(data.reminders || []);
          setPaused(data.invoice.status === 'paused');
          setStatus(
            data.invoice.status === 'paid' ? 'Paid' :
            data.invoice.status === 'paused' ? 'Paused' :
            data.invoice.status === 'disputed' ? 'Disputed' :
            'Chasing'
          );
        }
      })
      .catch(() => addToast('Failed to load invoice', 'error'))
      .finally(() => setLoading(false));
  }, [id, addToast]);

  const notify = (message: string) => addToast(message, 'success');

  const handlePauseResume = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      if (paused) {
        await api.invoices.update(invoice.id, { status: 'pending' });
        setPaused(false);
        setStatus('Chasing');
        notify('AI chasing resumed');
      } else {
        await api.invoices.update(invoice.id, { status: 'paused' });
        setPaused(true);
        setStatus('Paused');
        notify('AI chasing paused');
      }
    } catch {
      addToast('Failed to update', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!invoice) return;
    setActionLoading(true);
    try {
      await api.invoices.update(invoice.id, { status: 'paid', ai_status: 'paid' });
      setStatus('Paid');
      setInvoice({ ...invoice, status: 'paid', ai_status: 'paid' });
      notify('Invoice marked as paid');
    } catch {
      addToast('Failed to update', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendReminder = async () => {
    notify('Reminder queued for sending');
  };

  const copyPaymentLink = () => {
    const link = `${window.location.origin}/pay/${id}`;
    navigator.clipboard?.writeText(link);
    notify('Payment link copied');
  };

  if (loading) {
    return (
      <AppLayout title={id} subtitle="Invoice recovery workspace" backPath="/app/invoices">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
        </div>
      </AppLayout>
    );
  }

  if (!invoice) {
    return (
      <AppLayout title="Invoice not found" subtitle="" backPath="/app/invoices">
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="w-16 h-16 text-gray-300 mb-4" />
          <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">Invoice not found</h3>
          <p className="text-sm text-gray-500 mb-6">This invoice may have been removed.</p>
          <Link href="/app/invoices" className="bg-brand-blue text-white px-5 py-2.5 rounded-xl font-bold text-sm">Back to invoices</Link>
        </div>
      </AppLayout>
    );
  }

  const shortId = id.slice(0, 8);
  const dueDate = new Date(invoice.due_date);
  const today = new Date();
  const daysOverdue = Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / 86400000));

  return (
    <AppLayout
      title={`#${shortId}`}
      subtitle="Invoice recovery workspace"
      backPath="/app/invoices"
      actions={
        <button
          onClick={handleSendReminder}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white shadow-glow-blue"
        >
          <Send className="h-4 w-4" /> Send reminder
        </button>
      }
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/app/invoices" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" /> Back to invoices
          </Link>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg border border-gray-200 bg-white p-2 text-gray-500 hover:bg-gray-50"
              aria-label="Invoice actions"
            >
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-11 z-20 w-48 rounded-xl border border-gray-200 bg-white p-1 shadow-xl">
                <button
                  onClick={() => { handleMarkPaid(); setShowMenu(false); }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  Mark as paid
                </button>
                <button
                  onClick={() => { notify('Invoice marked as disputed'); setShowMenu(false); }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  Mark disputed
                </button>
                <Link
                  href={`/pay/${id}`}
                  target="_blank"
                  className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  View payment portal
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="space-y-6">
            {/* Invoice summary */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-blue">
                    {status === 'Paid' ? 'Invoice paid' : 'Outstanding invoice'}
                  </p>
                  <h2 className="mt-2 font-heading text-3xl font-bold text-gray-900">#{shortId}</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Due {formatDate(invoice.due_date)}
                    {invoice.created_at && ` · Created ${formatDate(invoice.created_at)}`}
                  </p>
                </div>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                  status === 'Paid' ? 'border-emerald-100 bg-emerald-50 text-emerald-700' :
                  status === 'Paused' ? 'border-gray-100 bg-gray-50 text-gray-600' :
                  status === 'Disputed' ? 'border-orange-100 bg-orange-50 text-orange-700' :
                  'border-amber-100 bg-amber-50 text-amber-700'
                }`}>
                  {status}
                </span>
              </div>

              <div className="mt-8 grid gap-5 border-y border-gray-100 py-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-gray-400">Amount due</p>
                  <p className="mt-1 font-heading text-3xl font-bold text-gray-900">
                    {formatCurrency(Number(invoice.amount), invoice.currency)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Days overdue</p>
                  <p className={`mt-1 text-xl font-bold ${daysOverdue > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                    {daysOverdue > 0 ? `${daysOverdue} days` : 'Not overdue'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Reminders sent</p>
                  <p className="mt-1 text-xl font-bold text-gray-900">{invoice.reminder_count || 0}</p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  onClick={handlePauseResume}
                  disabled={actionLoading || status === 'Paid'}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> :
                    paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {paused ? 'Resume AI chasing' : 'Pause AI chasing'}
                </button>
                {status !== 'Paid' && (
                  <button
                    onClick={handleMarkPaid}
                    disabled={actionLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" /> Mark as paid
                  </button>
                )}
              </div>
            </section>

            {/* Recovery timeline */}
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-heading text-lg font-bold text-gray-900">Recovery timeline</h2>
                  <p className="mt-1 text-sm text-gray-500">Every touchpoint, in one place.</p>
                </div>
                <Bell className="h-5 w-5 text-gray-400" />
              </div>
              <div className="mt-6 flex flex-col gap-6">
                {reminders.length > 0 ? reminders.map((r, i) => (
                  <div key={i} className="flex gap-4">
                    <div className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-full ${
                      r.decline_reason ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-brand-blue'
                    }`}>
                      {r.decline_reason ? <AlertCircle className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
                        {formatDate(r.sent_at)}
                      </p>
                      <p className="mt-1 font-bold text-gray-900">
                        {r.decline_reason ? `Payment declined: ${r.decline_reason}` : `Reminder sent (Level ${r.tone_level || '—'})`}
                      </p>
                      {r.email_content && (
                        <p className="mt-1 text-sm leading-6 text-gray-500 line-clamp-2">{r.email_content}</p>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center">
                    <Clock className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-sm font-bold text-gray-600">No reminders sent yet</p>
                    <p className="text-xs text-gray-400 mt-1">The AI chase engine will send the first reminder after the due date.</p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-brand-blue/10 text-sm font-bold text-brand-blue">
                  {invoice.client_name?.slice(0, 2).toUpperCase() || 'CL'}
                </div>
                <div>
                  <p className="font-bold text-gray-900">{invoice.client_name}</p>
                  <p className="text-xs text-gray-500">{invoice.client_email}</p>
                </div>
              </div>
              <div className="mt-6 flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Invoice status</span>
                  <span className={`font-bold ${
                    status === 'Paid' ? 'text-emerald-600' :
                    status === 'Disputed' ? 'text-orange-600' :
                    daysOverdue > 14 ? 'text-red-600' : 'text-gray-900'
                  }`}>
                    {status === 'Paid' ? 'Paid' : daysOverdue > 0 ? 'Overdue' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Reminders</span>
                  <span className="font-bold text-gray-900">{invoice.reminder_count || 0}</span>
                </div>
                <Link href="/app/clients" className="mt-2 inline-flex items-center gap-2 font-bold text-brand-blue">
                  View client profile <UserRound className="h-4 w-4" />
                </Link>
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="font-heading font-bold text-gray-900">Payment link</h2>
              <p className="mt-1 text-xs leading-5 text-gray-500">Share a secure link with your client.</p>
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-gray-50 p-3">
                <span className="min-w-0 flex-1 truncate text-xs text-gray-500">astrix.ai/pay/{shortId}</span>
                <button
                  onClick={copyPaymentLink}
                  className="rounded-lg p-2 text-brand-blue hover:bg-white"
                  aria-label="Copy payment link"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <Link
                href={`/pay/${id}`}
                target="_blank"
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
              >
                <ShieldCheck className="h-4 w-4 text-emerald-600" /> Preview payment portal
              </Link>
            </section>

            <button
              onClick={() => notify('Invoice PDF download prepared')}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 shadow-sm hover:bg-gray-50"
            >
              <Download className="h-4 w-4" /> Download invoice
            </button>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}
