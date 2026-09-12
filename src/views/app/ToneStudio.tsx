'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '../../layouts/AppLayout';
import { Bot, RefreshCw, Sparkles, Zap, Copy } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useToneSettings, api } from '../../lib/api';
import { AIBadge } from '../../components/ui/AIBadge';

export const ToneStudio = () => {
  const { activeWorkspace } = useWorkspace();
  const { data: existingTone, isLoading: toneLoading } = useToneSettings(activeWorkspace?.id);
  const { addToast } = useToast();
  
  const [toneLevel, setToneLevel] = useState(2);
  const [toneSample, setToneSample] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedPreview, setGeneratedPreview] = useState('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing tone settings
  useEffect(() => {
    if (existingTone) {
      setToneSample(existingTone.sample_emails || '');
      setToneLevel(existingTone.tone_level || 2);
      setAiPrompt(existingTone.ai_prompt || '');
    }
  }, [existingTone]);

  const handleGeneratePreview = async () => {
    if (!toneSample.trim()) { addToast('Paste a sample email first.', 'warning'); return; }
    setIsGeneratingPreview(true);
    try {
      // First, generate a tone prompt if we don't have one
      let prompt = aiPrompt;
      if (!prompt) {
        const toneRes = await fetch('/api/ai/generate-tone', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sampleEmails: toneSample }),
        });
        if (!toneRes.ok) throw new Error('Failed to analyze tone');
        const toneData = await toneRes.json();
        prompt = toneData.tonePrompt;
        setAiPrompt(prompt);
      }

      // Then generate a preview email
      const emailRes = await fetch('/api/ai/generate-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: 'Sarah',
          invoiceAmount: 2400,
          currency: 'USD',
          invoiceId: 'INV-1042',
          daysOverdue: 14,
          reminderCount: 1,
          toneLevel,
          tonePrompt: prompt,
          paymentLink: 'pay.astrix.ai/INV-1042',
        }),
      });
      if (!emailRes.ok) throw new Error('Failed to generate email');
      const emailData = await emailRes.json();
      setGeneratedPreview(emailData.emailContent);
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'AI generation failed', 'error');
    } finally {
      setIsGeneratingPreview(false);
    }
  };

  const handleSave = async () => {
    if (!activeWorkspace) return;
    setIsSaving(true);
    try {
      await api.tone.save({
        workspace_id: activeWorkspace.id,
        sample_emails: toneSample,
        tone_level: toneLevel,
        ai_prompt: aiPrompt || `Tone level ${toneLevel}. Professional and friendly. Sample: ${toneSample.substring(0, 200)}`,
        updated_at: new Date().toISOString(),
      });
      addToast('Tone settings saved!', 'success');
    } catch (err) {
      addToast('Failed to save tone settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPreview);
    addToast('Copied to clipboard', 'success');
  };

  if (toneLoading) {
    return (
      <AppLayout title="Tone Studio" subtitle="Train the AI to sound exactly like you.">
        <div className="animate-pulse space-y-6">
          <div className="h-32 rounded-2xl bg-gray-100" />
          <div className="grid grid-cols-2 gap-6">
            <div className="h-96 rounded-2xl bg-gray-100" />
            <div className="h-96 rounded-2xl bg-gray-100" />
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Tone Studio" 
      subtitle="Train the AI to sound exactly like you."
    >
      <div className="space-y-6 animate-[fadeIn_0.3s_ease-out]">
        
        {/* Intro Banner */}
        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 rounded-2xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-purple-500/20 to-transparent"></div>
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <AIBadge />
              <span className="text-xs font-bold uppercase tracking-widest text-purple-300">Voice Cloning</span>
            </div>
            <h2 className="font-heading text-2xl font-black mb-2">Automate Follow-ups with Personality</h2>
            <p className="text-purple-200 text-sm md:text-base leading-relaxed">
              Don't sound like a robot. Provide a few examples of how you normally email your clients, and our AI will dynamically adjust its tone based on how overdue an invoice is, while preserving your unique writing style.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: Training Input */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="font-heading text-lg font-bold text-gray-900 mb-6">1. Provide Training Data</h2>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">Sample Email(s)</label>
                <textarea 
                  value={toneSample}
                  onChange={e => { setToneSample(e.target.value); setAiPrompt(''); }}
                  placeholder="Hey team, just following up on the attached invoice. Let me know if you need anything else from my end! Best, John..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm outline-none focus:ring-2 focus:ring-brand-blue resize-none h-48 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-3">
                  2. Select Escalation Level — <span className="text-brand-blue">Level {toneLevel}</span>
                  <span className="ml-2 text-gray-400 font-normal">
                    ({toneLevel === 1 ? 'Friendly' : toneLevel === 2 ? 'Balanced' : 'Firm'})
                  </span>
                </label>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {[
                    { level: 1, label: 'Friendly', emoji: '😊', desc: 'Warm & casual' },
                    { level: 2, label: 'Balanced', emoji: '📧', desc: 'Professional' },
                    { level: 3, label: 'Firm', emoji: '📋', desc: 'Assertive & direct' },
                  ].map(opt => (
                    <button
                      key={opt.level}
                      onClick={() => setToneLevel(opt.level)}
                      className={`p-3 rounded-xl text-sm font-bold transition-all border ${
                        toneLevel === opt.level 
                          ? 'bg-brand-blue text-white border-brand-blue shadow-sm scale-[1.02]' 
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-lg mb-1">{opt.emoji}</div>
                      <div>{opt.label}</div>
                      <div className={`text-[10px] font-normal mt-0.5 ${toneLevel === opt.level ? 'text-blue-100' : 'text-gray-400'}`}>{opt.desc}</div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  The AI automatically moves from Level 1 to Level 3 the longer an invoice remains unpaid. Test how your cloned voice sounds at each level.
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={handleGeneratePreview}
                  disabled={isGeneratingPreview || !toneSample.trim()}
                  className="flex-1 bg-gray-900 text-white py-3.5 rounded-xl font-bold hover:bg-black disabled:opacity-50 transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                >
                  {isGeneratingPreview ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Analyzing & Generating...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 text-brand-yellow" /> Generate Preview</>
                  )}
                </button>
                {aiPrompt && (
                  <button 
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-brand-blue text-white px-6 py-3.5 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm shadow-sm"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right: Preview Output */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-heading text-lg font-bold text-gray-900">AI-Generated Preview</h2>
              {generatedPreview && (
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy
                </button>
              )}
            </div>

            {generatedPreview ? (
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    toneLevel === 1 ? 'bg-green-50 text-green-700 border-green-200' : 
                    toneLevel === 2 ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                    'bg-orange-50 text-orange-700 border-orange-200'
                  }`}>
                    Level {toneLevel} — {toneLevel === 1 ? 'Friendly' : toneLevel === 2 ? 'Balanced' : 'Firm'}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Your Voice Cloned
                  </span>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 md:p-6 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-medium flex-1 min-h-[250px] shadow-inner">
                  {generatedPreview}
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                  <Zap className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-gray-900 mb-1">1-Click Checkout Embedded</p>
                    <p className="text-xs text-gray-600">Every reminder will dynamically include a unique payment link (e.g., <span className="font-mono text-brand-blue font-bold">pay.astrix.ai/1042</span>) using your connected Gateway.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 min-h-[400px] text-center p-8">
                <Bot className="w-16 h-16 text-gray-300 mb-4" />
                <p className="text-base font-bold text-gray-600 mb-2">No preview generated yet</p>
                <p className="text-sm text-gray-400 max-w-sm">
                  Paste a sample email on the left and click "Generate Preview" to see how Astrix AI mimics your writing style.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ToneStudio;
