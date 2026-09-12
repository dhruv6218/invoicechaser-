import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppLayout } from '../../layouts/AppLayout';
import { 
  FileText, CheckCircle2, AlertCircle, Clock, Send, TrendingUp, Pause, Play, Plus, Eye, Search, Download, X
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Skeleton } from '../../components/ui/Skeleton';

interface Invoice {
  id: string;
  client_name: string;
  client_email: string;
  amount: number;
  currency: string;
  due_date: string;
  status: 'pending' | 'paid' | 'paused' | 'disputed';
  days_overdue: number;
  ai_status: 'nudge_sent' | 'escalated' | 'paid' | 'pending';
  last_chased_at: string | null;
  reminder_count: number;
}

const MOCK_INVOICES: Invoice[] = [
  { id: '1', client_name: 'Acme Corp', client_email: 'billing@acme.com', amount: 2400, currency: 'USD', due_date: '2025-01-01', status: 'pending', days_overdue: 14, ai_status: 'nudge_sent', last_chased_at: '2025-01-10', reminder_count: 2 },
  { id: '2', client_name: 'TechStart GmbH', client_email: 'finance@techstart.de', amount: 1800, currency: 'EUR', due_date: '2024-12-28', status: 'pending', days_overdue: 18, ai_status: 'escalated', last_chased_at: '2025-01-08', reminder_count: 3 },
  { id: '3', client_name: 'DataFlow Ltd', client_email: 'accounts@dataflow.co', amount: 890, currency: 'USD', due_date: '2025-01-05', status: 'pending', days_overdue: 10, ai_status: 'pending', last_chased_at: null, reminder_count: 0 },
  { id: '4', client_name: 'InnovateLab', client_email: 'pay@innovatelab.com', amount: 1500, currency: 'USD', due_date: '2024-12-15', status: 'paid', days_overdue: 0, ai_status: 'paid', last_chased_at: '2024-12-20', reminder_count: 1 },
  { id: '5', client_name: 'CloudScale Inc', client_email: 'ap@cloudscale.io', amount: 3200, currency: 'USD', due_date: '2024-12-20', status: 'paused', days_overdue: 25, ai_status: 'nudge_sent', last_chased_at: '2025-01-05', reminder_count: 2 },
];

export const Invoices = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'pending' | 'paused' | 'paid'>('all');
  const [query, setQuery] = useState('');
  const [selectedInvoices, setSelectedInvoices] = useState<string[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInvoices(MOCK_INVOICES);
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const formatCurrency = (value: number, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
  };

  const handlePauseAI = (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'paused' as const } : inv));
    addToast('AI paused for this invoice. You can resume anytime.', 'success');
  };

  const handleResumeAI = (id: string) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status: 'pending' as const } : inv));
    addToast('AI resumed. Next reminder scheduled in 3 days.', 'success');
  };

  const getStatusBadge = (status: Invoice['status'], aiStatus: Invoice['ai_status']) => {
    if (status === 'paid') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-green-100 text-green-700 border border-green-200 whitespace-nowrap"><CheckCircle2 className="w-3 h-3" /> Paid</span>;
    if (status === 'paused') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200 whitespace-nowrap"><Pause className="w-3 h-3" /> AI Paused</span>;
    if (status === 'disputed') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200 whitespace-nowrap"><AlertCircle className="w-3 h-3" /> Disputed</span>;
    switch (aiStatus) {
      case 'nudge_sent': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200 whitespace-nowrap"><Send className="w-3 h-3" /> Nudge Sent</span>;
      case 'escalated': return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 whitespace-nowrap"><TrendingUp className="w-3 h-3" /> Escalated</span>;
      default: return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 whitespace-nowrap"><Clock className="w-3 h-3" /> Queued</span>;
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesFilter = invoiceFilter === 'all' || inv.status === invoiceFilter;
    const matchesQuery = `${inv.client_name} ${inv.client_email} ${inv.id}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const toggleSelected = (id: string) => setSelectedInvoices((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const exportInvoices = () => addToast(`${filteredInvoices.length} invoices ready to export`, 'success');

  if (isLoading) {
    return (
      <AppLayout title="Action Center" subtitle="Manage your invoices and AI schedules">
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
          <Skeleton className="h-[400px] rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Action Center" 
      subtitle="Manage your invoices and AI schedules"
      actions={
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-upload-modal'))}
          className="flex items-center gap-2 bg-astrix-teal text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-astrix-darkTeal transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Invoice
        </button>
      }
    >
      <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
        
        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'All Invoices', count: invoices.length, color: 'text-gray-900', bg: 'bg-white border border-gray-200 shadow-sm', filter: 'all' as const },
            { label: 'Pending', count: invoices.filter(i => i.status === 'pending').length, color: 'text-yellow-700', bg: 'bg-yellow-50 border border-yellow-200 shadow-sm', filter: 'pending' as const },
            { label: 'Paused', count: invoices.filter(i => i.status === 'paused').length, color: 'text-gray-600', bg: 'bg-gray-50 border border-gray-200 shadow-sm', filter: 'paused' as const },
            { label: 'Paid', count: invoices.filter(i => i.status === 'paid').length, color: 'text-green-700', bg: 'bg-green-50 border border-green-200 shadow-sm', filter: 'paid' as const },
          ].map(stat => (
            <button 
              key={stat.label}
              onClick={() => setInvoiceFilter(stat.filter)}
              className={`p-4 rounded-2xl text-left transition-all ${stat.bg} ${invoiceFilter === stat.filter ? 'ring-2 ring-astrix-teal ring-offset-2 scale-[1.02]' : 'hover:scale-[1.01]'}`}
            >
              <div className="text-2xl font-heading font-black text-gray-900">{stat.count}</div>
              <div className={`text-xs font-bold ${stat.color}`}>{stat.label}</div>
            </button>
          ))}
        </div>

        {/* Invoice Table */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h2 className="font-heading text-base font-bold text-gray-900">
              {invoiceFilter === 'all' ? 'All Invoices' : `${invoiceFilter.charAt(0).toUpperCase() + invoiceFilter.slice(1)} Invoices`}
            </h2>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {selectedInvoices.length > 0 && <button onClick={() => { addToast(`${selectedInvoices.length} reminders queued`, 'success'); setSelectedInvoices([]); }} className="rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white">Send reminders ({selectedInvoices.length})</button>}
              <label className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-500"><Search className="h-3.5 w-3.5" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoices" aria-label="Search invoices" className="w-28 bg-transparent outline-none sm:w-40" />{query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X className="h-3.5 w-3.5" /></button>}</label>
              <button onClick={exportInvoices} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"><Download className="w-3.5 h-3.5" /> Export CSV</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100 bg-white">
                <tr>
                  {['Client', 'Amount', 'Due Date', 'Overdue', 'AI Status', 'Reminders', 'Actions'].map(h => (
                    <th key={h} className="p-4 text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 bg-white">
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3"><input type="checkbox" checked={selectedInvoices.includes(invoice.id)} onChange={() => toggleSelected(invoice.id)} aria-label={`Select ${invoice.client_name}`} className="accent-brand-blue" /><div><Link href={`/app/invoices/${invoice.id}`} className="font-bold text-gray-900 hover:text-brand-blue">{invoice.client_name}</Link>
                      <div className="text-xs text-gray-400">{invoice.client_email}</div></div></div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-gray-900 font-mono">{formatCurrency(invoice.amount, invoice.currency)}</span>
                    </td>
                    <td className="p-4">
                      <span className="text-gray-600 font-medium">{new Date(invoice.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </td>
                    <td className="p-4">
                      {invoice.days_overdue > 0 ? (
                        <span className={`font-bold text-sm ${invoice.days_overdue > 14 ? 'text-red-600' : invoice.days_overdue > 7 ? 'text-orange-500' : 'text-yellow-600'}`}>
                          {invoice.days_overdue} days
                        </span>
                      ) : (
                        <span className="text-green-600 font-bold">—</span>
                      )}
                    </td>
                    <td className="p-4">{getStatusBadge(invoice.status, invoice.ai_status)}</td>
                    <td className="p-4">
                      <span className="font-mono font-bold text-gray-600">{invoice.reminder_count}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {invoice.status === 'paused' ? (
                          <button 
                            onClick={() => handleResumeAI(invoice.id)}
                            aria-label={`Resume AI for ${invoice.client_name}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors shadow-sm"
                          >
                            <Play className="w-3 h-3" /> Resume
                          </button>
                        ) : invoice.status !== 'paid' && (
                          <button 
                            onClick={() => handlePauseAI(invoice.id)}
                            aria-label={`Pause AI for ${invoice.client_name}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors shadow-sm"
                          >
                            <Pause className="w-3 h-3" /> Pause AI
                          </button>
                        )}
                        <button className="p-2 text-gray-400 hover:text-gray-700 transition-colors rounded-lg hover:bg-gray-100">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredInvoices.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6 bg-white">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">All clear!</h3>
              <p className="text-sm text-gray-500 mb-6">No {invoiceFilter !== 'all' ? invoiceFilter : ''} invoices found.</p>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('open-upload-modal'))}
                className="bg-brand-blue text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-colors text-sm shadow-sm"
              >
                Add New Invoice
              </button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default Invoices;
