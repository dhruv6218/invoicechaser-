import PaymentOutcome from '../../../../views/public/PaymentOutcome';

export default async function PaymentStatePage({ params }: { params: Promise<{ invoiceId: string; state: string }> }) {
  const { invoiceId, state } = await params;
  const allowed = ['success', 'failed', 'cancelled', 'dispute', 'already-paid'] as const;
  const selected = allowed.includes(state as (typeof allowed)[number]) ? state as (typeof allowed)[number] : 'failed';
  return <PaymentOutcome invoiceId={invoiceId} state={selected} />;
}
