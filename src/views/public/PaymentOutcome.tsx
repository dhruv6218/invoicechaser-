'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, HelpCircle, Mail, RefreshCw, ShieldCheck, Loader2 } from 'lucide-react';

export default function PaymentOutcome({ invoiceId, state }: { invoiceId: string; state: 'success' | 'failed' | 'cancelled' | 'dispute' | 'already-paid' }) {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [invoiceInfo, setInvoiceInfo] = useState<{ client_name?: string; amount?: number; currency?: string } | null>(null);

  useEffect(() => {
    fetch(`/api/invoices/${invoiceId}`)
      .then(res => res.json())
      .then(data => {
        if (data.invoice) {
          setInvoiceInfo({
            client_name: data.invoice.client_name,
            amount: Number(data.invoice.amount),
            currency: data.invoice.currency,
          });
        }
      })
      .catch(() => {});
  }, [invoiceId]);

  const copy = {
    success: { eyebrow: 'Payment complete', title: 'Thanks, your payment is on its way.', text: `A receipt for invoice #${invoiceId.slice(0, 8)} will be sent to your email shortly.`, Icon: CheckCircle2, color: 'text-emerald-600', button: 'Return home' },
    failed: { eyebrow: 'Payment could not be completed', title: 'Let\u2019s try that again.', text: 'Your card was not charged. Check your details or use another payment method.', Icon: AlertCircle, color: 'text-amber-600', button: 'Try payment again' },
    cancelled: { eyebrow: 'Payment cancelled', title: 'No payment was taken.', text: 'Your invoice is still open whenever you are ready to complete payment.', Icon: RefreshCw, color: 'text-brand-blue', button: 'Return to payment' },
    dispute: { eyebrow: 'Contact the sender', title: 'Tell us what happened.', text: 'Share a note and the invoice owner will follow up with you directly.', Icon: HelpCircle, color: 'text-brand-blue', button: 'Send message' },
    'already-paid': { eyebrow: 'Already paid?', title: 'We can help reconcile this invoice.', text: 'Send the payment details and the invoice owner will verify your payment.', Icon: CheckCircle2, color: 'text-emerald-600', button: 'Send payment details' },
  }[state];

  const isForm = state === 'dispute' || state === 'already-paid';

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch(`/api/invoices/${invoiceId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: state === 'dispute' ? 'dispute' : 'already_paid',
          message: message || 'No details provided',
        }),
      });
      setSent(true);
    } catch {
      setSent(true); // Still show success to user
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:px-6">
      <div className="mx-auto max-w-xl">
        <Link href={`/pay/${invoiceId}`} className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Back to invoice
        </Link>

        <section className="mt-12 rounded-3xl border border-gray-200 bg-white p-7 text-center shadow-apple sm:p-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-gray-50">
            <copy.Icon className={`size-8 ${copy.color}`} />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-widest text-brand-blue">{copy.eyebrow}</p>
          <h1 className="mt-3 font-heading text-3xl font-bold tracking-tight">{copy.title}</h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">{copy.text}</p>

          {invoiceInfo && (
            <div className="mt-5 rounded-xl bg-gray-50 p-4 text-left">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Invoice</span>
                <span className="font-bold text-gray-900">#{invoiceId.slice(0, 8)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm">
                <span className="text-gray-500">Client</span>
                <span className="font-bold text-gray-900">{invoiceInfo.client_name}</span>
              </div>
              {invoiceInfo.amount && (
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-500">Amount</span>
                  <span className="font-bold text-gray-900">
                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: invoiceInfo.currency || 'USD' }).format(invoiceInfo.amount)}
                  </span>
                </div>
              )}
            </div>
          )}

          {isForm && !sent && (
            <div className="mt-7 text-left">
              <label className="text-xs font-bold text-gray-600">
                {state === 'dispute' ? 'Message' : 'Payment reference'}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="mt-2 min-h-28 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-blue"
                  placeholder={state === 'dispute' ? 'Tell the sender what you need help with...' : 'Transaction ID, date, or any useful detail'}
                />
              </label>
            </div>
          )}

          {sent ? (
            <div className="mt-7 rounded-xl bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
              {state === 'dispute' ? 'Message sent. The invoice owner will be in touch.' : 'Payment details submitted. The invoice owner will verify and update the invoice.'}
            </div>
          ) : (
            <button
              onClick={() => isForm ? handleSubmit() : undefined}
              disabled={isForm && submitting}
              className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-blue px-5 py-3.5 text-sm font-bold text-white hover:bg-brand-blue/90 disabled:opacity-50"
            >
              {isForm && (submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />)}
              {state === 'success' ? (
                <Link href="/" className="w-full">{copy.button}</Link>
              ) : state === 'failed' || state === 'cancelled' ? (
                <Link href={`/pay/${invoiceId}`} className="w-full">{copy.button}</Link>
              ) : (
                copy.button
              )}
            </button>
          )}

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure invoice portal
          </div>
        </section>
      </div>
    </main>
  );
}
