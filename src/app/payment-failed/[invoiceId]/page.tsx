import PaymentOutcome from '../../../views/public/PaymentOutcome';
export default async function Page({ params }: { params: Promise<{ invoiceId: string }> }) { const { invoiceId } = await params; return <PaymentOutcome invoiceId={invoiceId} state="failed" />; }
