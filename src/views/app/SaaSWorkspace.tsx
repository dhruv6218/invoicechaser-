'use client';

import { useMemo, useState } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { useToast } from '../../contexts/ToastContext';
import { Search, Plus, Download, MoreHorizontal, ArrowUpRight, CheckCircle2, Clock3, AlertTriangle, Users, Mail, Bell, LifeBuoy, SlidersHorizontal, X } from 'lucide-react';

const notifications: Array<{ title: string; text: string; time: string; Icon: React.ComponentType<{ className?: string }>; tone: string }> = [
  { title: 'Payment recovered', text: 'Northstar Studio paid invoice INV-1045.', time: '2 min ago', Icon: CheckCircle2, tone: 'green' },
  { title: 'Invoice needs attention', text: 'Mosaic Labs is 8 days overdue.', time: '1 hour ago', Icon: AlertTriangle, tone: 'amber' },
  { title: 'Reminder sent', text: 'A friendly nudge was sent to Tangent Works.', time: 'Yesterday', Icon: Mail, tone: 'blue' },
];

const data = {
  clients: [
    { name: 'Northstar Studio', email: 'finance@northstar.studio', invoices: 4, outstanding: '$12,840', status: 'Healthy' },
    { name: 'Mosaic Labs', email: 'ap@mosiaclabs.com', invoices: 2, outstanding: '$4,260', status: 'At risk' },
    { name: 'Tangent Works', email: 'hello@tangent.works', invoices: 6, outstanding: '$1,900', status: 'Healthy' },
    { name: 'Harbor & Co.', email: 'billing@harborco.com', invoices: 1, outstanding: '$860', status: 'New' },
  ],
  invoices: [
    { id: 'INV-1048', client: 'Northstar Studio', amount: '$8,400', due: '2 days overdue', status: 'Chasing' },
    { id: 'INV-1047', client: 'Mosaic Labs', amount: '$4,260', due: '8 days overdue', status: 'At risk' },
    { id: 'INV-1046', client: 'Tangent Works', amount: '$1,900', due: 'Due tomorrow', status: 'Scheduled' },
    { id: 'INV-1045', client: 'Harbor & Co.', amount: '$860', due: 'Paid yesterday', status: 'Paid' },
  ],
};

const config: Record<string, { title: string; subtitle: string }> = {
  clients: { title: 'Clients', subtitle: 'See every relationship behind your receivables.' },
  sequences: { title: 'Reminder sequences', subtitle: 'Make every follow-up feel intentional and on-brand.' },
  templates: { title: 'Email templates', subtitle: 'Reusable messages for every payment moment.' },
  notifications: { title: 'Notifications', subtitle: 'Stay ahead of recovery events and account health.' },
  help: { title: 'Help & support', subtitle: 'Everything you need to keep collections moving.' },
};

function StatusPill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: string }) {
  const styles: Record<string, string> = { blue: 'bg-blue-50 text-blue-700 border-blue-100', green: 'bg-emerald-50 text-emerald-700 border-emerald-100', amber: 'bg-amber-50 text-amber-700 border-amber-100', red: 'bg-red-50 text-red-700 border-red-100' };
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${styles[tone] || styles.blue}`}>{children}</span>;
}

export function SaaSWorkspace({ section }: { section: keyof typeof config }) {
  const { addToast } = useToast();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [enabled, setEnabled] = useState<Record<string, boolean>>({ friendly: true, second: true, final: false });
  const meta = config[section];
  const filteredClients = useMemo(() => data.clients.filter((item) => `${item.name} ${item.email}`.toLowerCase().includes(query.toLowerCase())), [query]);

  const action = (message: string) => addToast(message, 'success');

  return <AppLayout title={meta.title} subtitle={meta.subtitle} actions={<button onClick={() => setShowModal(true)} className="inline-flex items-center gap-2 rounded-lg bg-brand-blue px-3 py-2 text-xs font-bold text-white shadow-glow-blue"><Plus className="h-4 w-4" /> {section === 'clients' ? 'Add client' : section === 'templates' ? 'New template' : 'Create sequence'}</button>}>
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div><p className="font-heading text-2xl font-bold text-gray-900">{section === 'clients' ? 'Relationships, not just rows.' : meta.title}</p><p className="mt-1 text-sm text-gray-500">A focused workspace for the next best recovery action.</p></div>
        {['clients', 'templates'].includes(section) && <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2"><Search className="h-4 w-4 text-gray-400" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." className="w-40 bg-transparent text-sm outline-none" /></div>}
      </div>

      {section === 'clients' && <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-gray-100 p-4"><span className="text-xs font-bold uppercase tracking-widest text-gray-400">{filteredClients.length} active clients</span><button onClick={() => action('Client CSV export prepared')} className="flex items-center gap-2 text-xs font-bold text-brand-blue"><Download className="h-4 w-4" /> Export</button></div><div className="divide-y divide-gray-100">{filteredClients.map((client) => <div key={client.email} className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue/10 font-bold text-brand-blue">{client.name.slice(0, 2)}</div><div><p className="font-bold text-gray-900">{client.name}</p><p className="text-xs text-gray-500">{client.email}</p></div></div><div className="flex items-center gap-6 text-sm"><div><p className="text-xs text-gray-400">Invoices</p><p className="font-bold text-gray-900">{client.invoices}</p></div><div><p className="text-xs text-gray-400">Outstanding</p><p className="font-bold text-gray-900">{client.outstanding}</p></div><StatusPill tone={client.status === 'At risk' ? 'amber' : 'green'}>{client.status}</StatusPill><button onClick={() => action(`Opened ${client.name}`)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-900"><ArrowUpRight className="h-4 w-4" /></button></div></div>)}</div></div>}

      {section === 'sequences' && <div className="grid gap-4 md:grid-cols-3">{[['friendly', 'Friendly nudge', '3 days after due', 'A warm reminder that keeps the relationship intact.'], ['second', 'Second follow-up', '7 days after due', 'A clear, direct message with the payment link.'], ['final', 'Final notice', '14 days after due', 'Escalation language for invoices that need attention.']].map(([key, title, timing, desc]) => <div key={key} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="mb-6 flex items-start justify-between"><div className="rounded-xl bg-blue-50 p-3 text-brand-blue"><Mail className="h-5 w-5" /></div><button onClick={() => setEnabled((v) => ({ ...v, [key]: !v[key] }))} className={`h-6 w-11 rounded-full p-1 transition ${enabled[key] ? 'bg-brand-blue' : 'bg-gray-200'}`}><span className={`block h-4 w-4 rounded-full bg-white transition ${enabled[key] ? 'translate-x-5' : ''}`} /></button></div><h3 className="font-heading text-lg font-bold text-gray-900">{title}</h3><p className="mt-1 text-sm text-gray-500">{desc}</p><div className="mt-5 border-t border-gray-100 pt-4 text-xs font-bold text-gray-500">{timing} <span className="float-right text-brand-blue">{enabled[key] ? 'Active' : 'Paused'}</span></div></div>)}</div>}

      {section === 'templates' && <div className="grid gap-4 md:grid-cols-2">{['Payment reminder', 'Payment received', 'Failed payment', 'Already paid response'].map((name, i) => <div key={name} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="rounded-xl bg-blue-50 p-3 text-brand-blue"><Mail className="h-5 w-5" /></div><div><h3 className="font-bold text-gray-900">{name}</h3><p className="text-xs text-gray-500">Last edited {i + 1} day{i ? 's' : ''} ago</p></div></div><button onClick={() => action(`Editing ${name}`)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50"><MoreHorizontal className="h-5 w-5" /></button></div><p className="mt-5 rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">Hi {'{{client_name}}'}, a quick note that invoice {'{{invoice_number}}'} for {'{{amount}}'} is ready for payment. You can take care of it here: {'{{payment_link}}'}.</p><button onClick={() => action(`Previewed ${name}`)} className="mt-4 text-xs font-bold text-brand-blue">Preview message →</button></div>)}</div>}

      {section === 'notifications' && <div className="space-y-3">{notifications.map(({ title, text, time, Icon, tone }) => <div key={title} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className={`rounded-xl p-3 ${tone === 'green' ? 'bg-emerald-50 text-emerald-600' : tone === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-brand-blue'}`}><Icon className="h-5 w-5" /></div><div className="flex-1"><p className="font-bold text-gray-900">{title}</p><p className="text-sm text-gray-500">{text}</p></div><span className="text-xs text-gray-400">{time}</span></div>)}</div>}

      {section === 'help' && <div className="grid gap-4 md:grid-cols-3">{[['Getting started', 'Connect a gateway, import invoices, and choose your recovery voice.', SlidersHorizontal], ['Recovery playbook', 'Learn when Astrix sends reminders and how clients experience them.', LifeBuoy], ['Talk to support', 'Our team can help with setup, billing, or a tricky invoice.', Bell]].map(([title, text, Icon]) => <button key={title as string} onClick={() => action(`Opening ${title}`)} className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-blue"><Icon className="h-5 w-5 text-brand-blue" /><h3 className="mt-5 font-heading text-lg font-bold text-gray-900">{title as string}</h3><p className="mt-2 text-sm leading-6 text-gray-500">{text as string}</p><span className="mt-5 inline-block text-xs font-bold text-brand-blue">Open guide →</span></button>)}</div>}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-gray-100 p-4"><div><h2 className="font-heading font-bold text-gray-900">Recent recovery activity</h2><p className="text-xs text-gray-500">A live view of what needs your attention.</p></div><button onClick={() => action('Activity export prepared')} className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50"><Download className="h-4 w-4" /></button></div><div className="divide-y divide-gray-100">{data.invoices.map((invoice, index) => <div key={invoice.id} className="flex flex-col gap-3 p-4 md:flex-row md:items-center"><input type="checkbox" checked={selected.includes(invoice.id)} onChange={() => setSelected((items) => items.includes(invoice.id) ? items.filter((item) => item !== invoice.id) : [...items, invoice.id])} className="accent-brand-blue" /><div className="flex-1"><p className="font-bold text-gray-900">{invoice.id} · {invoice.client}</p><p className="text-xs text-gray-500">{invoice.due}</p></div><span className="font-bold text-gray-900">{invoice.amount}</span><StatusPill tone={invoice.status === 'Paid' ? 'green' : invoice.status === 'At risk' ? 'amber' : 'blue'}>{invoice.status}</StatusPill><button onClick={() => action(`Opened ${invoice.id}`)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50"><ArrowUpRight className="h-4 w-4" /></button></div>)}</div></div>
    </div>
    {showModal && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="font-heading text-xl font-bold text-gray-900">Create something new</h2><button onClick={() => setShowModal(false)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-50"><X className="h-5 w-5" /></button></div><p className="mt-2 text-sm text-gray-500">This demo flow is ready for your real data connection.</p><input placeholder="Name or title" className="mt-5 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-brand-blue" /><button onClick={() => { setShowModal(false); action('Saved successfully'); }} className="mt-4 w-full rounded-xl bg-brand-blue px-4 py-3 text-sm font-bold text-white">Save and continue</button></div></div>}
  </AppLayout>;
}

export default SaaSWorkspace;
