'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, ShieldCheck, ArrowLeft, CreditCard, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function PaymentPortal() {
  const [invoice, setInvoice] = useState<any>(null);
  const [workspace, setWorkspace] = useState<any>(null);
  const [gateway, setGateway] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    // Extract invoiceId from the URL path: /pay/[invoiceId]
    const pathParts = window.location.pathname.split('/');
    const invoiceId = pathParts[pathParts.length - 1];

    if (!invoiceId) {
      setError('Invalid invoice URL');
      setLoading(false);
      return;
    }

    fetch(`/api/invoices/${invoiceId}`)
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setInvoice(data.invoice);
          setWorkspace(data.workspace);
          setGateway(data.gateway);
          if (data.invoice.status === 'paid') {
            setPaid(true);
          }
        }
      })
      .catch(() => setError('Failed to load invoice'))
      .finally(() => setLoading(false));
  }, []);

  const handlePay = async () => {
    if (!invoice) return;
    setPaying(true);
    try {
      const res = await fetch(`/api/invoices/${invoice.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.url) {
        window.location.href = data.url;
      } else {
        setError('No payment URL returned');
      }
    } catch {
      setError('Failed to initiate payment');
    } finally {
      setPaying(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(amount);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </main>
    );
  }

  if (error || !invoice) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-apple">
          <AlertCircle className="mx-auto h-14 w-14 text-gray-400" />
          <h1 className="mt-5 font-heading text-2xl font-bold text-gray-900">Invoice not found</h1>
          <p className="mt-2 text-sm text-gray-500">{error || 'This invoice may have been removed.'}</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-brand-blue px-5 py-3 text-sm font-bold text-white">Return home</Link>
        </div>
      </main>
    );
  }

  if (paid) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-apple">
          <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-500" />
          <h1 className="mt-5 font-heading text-2xl font-bold text-gray-900">Payment received</h1>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            Your payment for invoice #{invoice.id.slice(0, 8)} has been recorded and a receipt is on its way.
          </p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-brand-blue px-5 py-3 text-sm font-bold text-white">Return home</Link>
        </div>
      </main>
    );
  }

  const shortId = invoice.id.slice(0, 8);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-500">
          <ArrowLeft className="h-4 w-4" /> Astrix
        </Link>

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-[1fr_0.8fr]">
          {/* Invoice details */}
          <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-apple">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-blue">Invoice payment</p>
            <h1 className="mt-3 font-heading text-3xl font-bold text-gray-900">#{shortId}</h1>
            <p className="mt-2 text-sm text-gray-500">{invoice.client_name} · {workspace?.name || 'Payment due'}</p>

            {invoice.due_date && (
              <p className="mt-1 text-xs text-gray-400">
                Due {new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            )}

            <div className="mt-10 border-y border-gray-100 py-6">
              <p className="text-sm text-gray-500">Amount due</p>
              <p className="mt-1 font-heading text-4xl font-bold text-gray-900">
                {formatCurrency(invoice.amount, invoice.currency)}
              </p>
            </div>

            {invoice.reminder_count > 0 && (
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                <AlertCircle className="h-4 w-4" />
                {invoice.reminder_count} reminder{invoice.reminder_count > 1 ? 's' : ''} sent · Last chased{' '}
                {invoice.last_chased_at ? new Date(invoice.last_chased_at).toLocaleDateString() : 'N/A'}
              </div>
            )}

            <div className="mt-6 flex items-center gap-3 text-sm text-gray-600">
              <ShieldCheck className="h-5 w-5 text-emerald-500" /> Secure payment powered by {workspace?.name || 'Astrix'}
            </div>
          </section>

          {/* Payment action */}
          <section className="rounded-3xl border border-gray-200 bg-white p-8 shadow-apple">
            <h2 className="font-heading text-xl font-bold text-gray-900">Complete payment</h2>

            {gateway?.type === 'stripe' && gateway.has_api_key ? (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                  <CreditCard className="h-4 w-4" /> Pay securely via Stripe
                </div>
                <button
                  onClick={handlePay}
                  disabled={paying}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {paying ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting to checkout...</>
                  ) : (
                    <><CreditCard className="h-4 w-4" /> Pay {formatCurrency(invoice.amount, invoice.currency)}</>
                  )}
                </button>
              </div>
            ) : gateway?.type === 'custom' && gateway.static_url ? (
              <div className="mt-6">
                <div className="flex items-center gap-2 mb-4 text-sm text-gray-500">
                  <ExternalLink className="h-4 w-4" /> Pay via payment link
                </div>
                <a
                  href={gateway.static_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-blue px-4 py-3.5 text-sm font-bold text-white hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4" /> Pay {formatCurrency(invoice.amount, invoice.currency)}
                </a>
              </div>
            ) : (
              <div className="mt-6">
                <div className="rounded-xl bg-amber-50 border border-amber-100 p-4 text-sm text-amber-700 flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <p>No online payment gateway is connected for this invoice. Please contact {workspace?.name || 'the sender'} to arrange payment.</p>
                </div>
              </div>
            )}

            <button
              onClick={() => setHelp(!help)}
              className="mt-3 w-full text-xs font-bold text-gray-500 hover:text-gray-700"
            >
              I already paid / need help
            </button>
            {help && (
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href={`/already-paid/${invoice.id}`}
                  className="rounded-xl bg-green-50 px-4 py-3 text-xs font-bold text-green-700 hover:bg-green-100 text-center"
                >
                  I already paid this invoice
                </Link>
                <Link
                  href={`/dispute/${invoice.id}`}
                  className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-bold text-amber-700 hover:bg-amber-100 text-center"
                >
                  I have a question / dispute
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
