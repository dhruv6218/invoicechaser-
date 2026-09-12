'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { CreditCard, CheckCircle2, Plus, ShieldCheck, Zap, Link as LinkIcon, Loader2, AlertCircle } from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useGateways, api } from '../../lib/api';
import { useToast } from '../../contexts/ToastContext';
import { Skeleton } from '../../components/ui/Skeleton';
import type { GatewayType } from '../../types';

interface GatewayConfig {
  type: GatewayType;
  label: string;
  placeholder: string;
  hint: string;
  color: string;
  bgColor: string;
  hoverColor: string;
  manageText: string;
}

const GATEWAY_CONFIGS: GatewayConfig[] = [
  { type: 'stripe', label: 'Stripe', placeholder: 'sk_live_... or sk_test_...', hint: 'API key from Stripe Dashboard → Developers → API Keys', color: 'bg-[#635BFF] text-white hover:bg-[#5249e5]', bgColor: '#635BFF', hoverColor: '#5249e5', manageText: 'Manage Stripe' },
  { type: 'razorpay', label: 'Razorpay', placeholder: 'rzp_live_... or rzp_test_...', hint: 'API key from Razorpay Dashboard → Settings → API Keys', color: 'bg-[#02042B] text-white hover:bg-black', bgColor: '#02042B', hoverColor: '#000', manageText: 'Manage Razorpay' },
  { type: 'custom', label: 'Static Link', placeholder: 'https://paypal.me/yourbusiness or upi://...', hint: 'Any payment link: PayPal.me, UPI, hosted checkout', color: 'bg-brand-blue text-white hover:bg-blue-700', bgColor: '#1a56ff', hoverColor: '#1a56ff', manageText: 'Update Link' },
];

export const Gateways = () => {
  const { activeWorkspace } = useWorkspace();
  const { data: gateways, isLoading, refetch } = useGateways(activeWorkspace?.id);
  const { addToast } = useToast();
  
  const [showInput, setShowInput] = useState<GatewayType | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [staticLink, setStaticLink] = useState('');

  useEffect(() => {
    const customGw = gateways?.find(g => g.type === 'custom');
    if (customGw?.static_url) setStaticLink(customGw.static_url);
  }, [gateways]);

  const handleConnect = async (type: GatewayType) => {
    if (!activeWorkspace || !apiKey.trim()) return;
    setIsConnecting(true);
    try {
      const config = GATEWAY_CONFIGS.find(g => g.type === type)!;
      await api.gateways.create({
        workspace_id: activeWorkspace.id,
        type,
        label: config.label,
        api_key: type !== 'custom' ? apiKey.trim() : undefined,
        static_url: type === 'custom' ? apiKey.trim() : undefined,
        is_active: true,
      });
      addToast(`${config.label} connected successfully!`, 'success');
      setApiKey('');
      setShowInput(null);
      refetch();
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to connect', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (id: string, label: string) => {
    try {
      await api.gateways.remove(id);
      addToast(`${label} disconnected`, 'success');
      refetch();
    } catch (err) {
      addToast('Failed to disconnect', 'error');
    }
  };

  const handleSaveStaticLink = async () => {
    if (!activeWorkspace || !staticLink.trim()) return;
    const existing = gateways?.find(g => g.type === 'custom');
    try {
      if (existing) {
        // Update via create (remove + create since we don't have an update route)
        await api.gateways.remove(existing.id);
      }
      await api.gateways.create({
        workspace_id: activeWorkspace.id,
        type: 'custom',
        label: 'Static Link',
        static_url: staticLink.trim(),
        is_active: true,
      });
      addToast('Payment link saved!', 'success');
      refetch();
    } catch (err) {
      addToast('Failed to save link', 'error');
    }
  };

  const isConnected = (type: string) => gateways?.some(g => g.type === type && g.is_active);

  if (isLoading) {
    return (
      <AppLayout title="Payment Gateways" subtitle="Connect integrations to enable 1-Click Checkouts">
        <div className="space-y-6">
          <Skeleton className="h-40 rounded-2xl" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Payment Gateways" 
      subtitle="Connect integrations to enable 1-Click Checkouts"
    >
      <div className="space-y-8 animate-[fadeIn_0.3s_ease-out]">
        
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 h-full w-64 bg-gradient-to-l from-brand-blue/20 to-transparent"></div>
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Secure Connections</span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-black mb-3">Seamless 1-Click Checkouts</h2>
            <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-6">
              Connect your preferred payment gateways. Astrix AI will automatically generate unique payment links for every overdue invoice and embed them directly into the reminder emails.
            </p>
            <div className="flex flex-wrap gap-4">
              <span className="flex items-center gap-1.5 text-xs font-bold bg-gray-800/50 border border-gray-700 rounded-full px-3 py-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> No transaction fees added
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold bg-gray-800/50 border border-gray-700 rounded-full px-3 py-1.5">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Instant settlements
              </span>
              <span className="flex items-center gap-1.5 text-xs font-bold bg-gray-800/50 border border-gray-700 rounded-full px-3 py-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-green-400" /> Keys encrypted (AES-256)
              </span>
            </div>
          </div>
        </div>

        {/* Gateways Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {GATEWAY_CONFIGS.filter(g => g.type !== 'custom').map(config => {
            const gateway = gateways?.find(g => g.type === config.type);
            const connected = !!gateway?.is_active;
            return (
              <div key={config.type} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg`} style={{ backgroundColor: config.bgColor }}>
                      {config.label[0]}
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-gray-900">{config.label}</h3>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-500 mb-6 flex-1">
                  {config.type === 'stripe' ? 'Global payments, Credit cards, Apple Pay, Google Pay.' : 'Perfect for India. UPI, Netbanking, and domestic cards.'}
                </p>

                <div className="space-y-4 mt-auto">
                  {connected ? (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Status</span>
                        <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Active</span>
                      </div>
                      <button 
                        onClick={() => handleDisconnect(gateway!.id, config.label)}
                        className="w-full py-2.5 rounded-xl font-bold text-sm transition-colors bg-white border-2 border-gray-200 text-gray-700 hover:border-red-300 hover:text-red-600"
                      >
                        Disconnect
                      </button>
                    </div>
                  ) : showInput === config.type ? (
                    <div className="space-y-3">
                      <input 
                        type="text" 
                        placeholder={config.placeholder}
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 outline-none focus:ring-2 focus:ring-brand-blue font-mono"
                      />
                      <p className="text-xs text-gray-400">{config.hint}</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleConnect(config.type)}
                          disabled={isConnecting || !apiKey.trim()}
                          className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-colors disabled:opacity-50 ${config.color}`}
                        >
                          {isConnecting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Connect ${config.label}`}
                        </button>
                        <button 
                          onClick={() => { setShowInput(null); setApiKey(''); }}
                          className="px-4 py-2.5 rounded-xl font-bold text-sm bg-gray-100 text-gray-600 hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setShowInput(config.type)}
                      className={`w-full py-3 rounded-xl font-bold text-sm transition-colors ${config.color}`}
                    >
                      <Plus className="w-4 h-4 inline mr-1" /> Connect {config.label}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Custom Link Card (Full Width) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group lg:col-span-3 flex flex-col md:flex-row items-center gap-6">
            <div className="w-16 h-16 bg-brand-blue/10 rounded-2xl flex items-center justify-center shrink-0">
              <LinkIcon className="w-8 h-8 text-brand-blue" />
            </div>
            <div className="flex-1 text-center md:text-left w-full">
              <h3 className="font-heading text-lg font-bold text-gray-900 mb-1">Global Static Payment Link</h3>
              <p className="text-sm text-gray-500 mb-3">
                Don't want to use an API gateway? Add a static link (like PayPal.me, UPI link, or a custom checkout page) that will be appended to all reminder emails.
              </p>
              <div className="flex gap-2">
                <input 
                  type="url" 
                  placeholder="https://paypal.me/yourbusiness" 
                  className="flex-1 border border-gray-300 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                  value={staticLink}
                  onChange={(e) => setStaticLink(e.target.value)}
                />
                <button 
                  onClick={handleSaveStaticLink}
                  className="px-6 py-2 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors whitespace-nowrap"
                >
                  Save Link
                </button>
              </div>
              {isConnected('custom') && (
                <p className="mt-2 text-xs text-green-600 font-bold flex items-center gap-1 justify-center md:justify-start">
                  <CheckCircle2 className="w-3 h-3" /> Static link is active
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  );
};

export default Gateways;
