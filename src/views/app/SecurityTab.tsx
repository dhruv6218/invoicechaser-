'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Smartphone, Loader2, CheckCircle2, AlertCircle, Trash2, KeyRound } from 'lucide-react';
import { getSupabaseBrowser } from '../../lib/supabase-browser';
import { useToast } from '../../contexts/ToastContext';

type Factor = {
  id: string;
  friendlyName: string;
  factorType: string;
  status: string;
};

export const SecurityTab: React.FC = () => {
  const supabase = getSupabaseBrowser();
  const { addToast } = useToast();

  const [factors, setFactors] = useState<Factor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  // Enrollment state
  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [verifyCode, setVerifyCode] = useState('');

  // Fetch existing MFA factors
  const fetchFactors = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      const totpFactors = (data?.totp || []).map((f: any) => ({
        id: f.id,
        friendlyName: f.friendly_name || 'Authenticator App',
        factorType: f.factor_type,
        status: f.status,
      }));
      setFactors(totpFactors);
    } catch {
      // MFA not available or error
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchFactors();
  }, [fetchFactors]);

  const activeFactor = factors.find((f) => f.status === 'verified');

  // Step 1: Enroll — generates TOTP secret + QR code
  const handleEnroll = async () => {
    setIsEnrolling(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Astrix Authenticator',
      });
      if (error) throw error;

      setEnrollFactorId(data.id);
      // Build QR code URL from the TOTP URI
      setQrUrl(`https://api.qrserver.com/v1/create-qr-code/?size=240x240&bgcolor=ffffff&data=${encodeURIComponent(data.totp.uri)}`);
      setSecret(data.totp.secret);
    } catch (err: any) {
      addToast(err.message || 'Failed to start MFA enrollment', 'error');
    } finally {
      setIsEnrolling(false);
    }
  };

  // Step 2: Verify — confirms the 6-digit code from the authenticator app
  const handleVerify = async () => {
    if (!enrollFactorId || !verifyCode) return;
    setIsVerifying(true);
    try {
      // Create a challenge
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enrollFactorId,
      });
      if (challengeError) throw challengeError;

      // Verify the code
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enrollFactorId,
        challengeId: challenge.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;

      addToast('Two-factor authentication enabled!', 'success');
      setEnrollFactorId(null);
      setQrUrl(null);
      setSecret(null);
      setVerifyCode('');
      fetchFactors();
    } catch (err: any) {
      addToast(err.message || 'Invalid code. Please try again.', 'error');
    } finally {
      setIsVerifying(false);
    }
  };

  // Unenroll — removes MFA
  const handleUnenroll = async () => {
    if (!activeFactor) return;
    if (!window.confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) return;
    setIsUnenrolling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: activeFactor.id,
      });
      if (error) throw error;
      addToast('Two-factor authentication disabled', 'success');
      fetchFactors();
    } catch (err: any) {
      addToast(err.message || 'Failed to disable 2FA', 'error');
    } finally {
      setIsUnenrolling(false);
    }
  };

  const cancelEnrollment = async () => {
    if (enrollFactorId) {
      await supabase.auth.mfa.unenroll({ factorId: enrollFactorId });
    }
    setEnrollFactorId(null);
    setQrUrl(null);
    setSecret(null);
    setVerifyCode('');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-brand-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Password Change Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-gray-500" /> Password
          </h2>
          <p className="text-sm text-gray-500 mt-1">Change your account password.</p>
        </div>
        <div className="p-6">
          <a href="/forgot-password" className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl">
            <KeyRound className="w-4 h-4" /> Send Password Reset Link
          </a>
        </div>
      </div>

      {/* 2FA Card */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100">
          <h2 className="font-heading text-lg font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-500" /> Two-Factor Authentication
          </h2>
          <p className="text-sm text-gray-500 mt-1">Add an extra layer of security with your authenticator app.</p>
        </div>

        <div className="p-6">
          {activeFactor ? (
            // 2FA is enabled
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-5 bg-green-50 border border-green-200 rounded-xl">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-green-900">2FA is Active</h4>
                  <p className="text-xs text-green-700 mt-1">
                    Your account is protected with {activeFactor.friendlyName}. You'll need a 6-digit code from your authenticator app on every login.
                  </p>
                </div>
              </div>
              <button
                onClick={handleUnenroll}
                disabled={isUnenrolling}
                className="flex items-center gap-2 text-sm font-bold text-red-600 hover:text-red-700 transition-colors bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl disabled:opacity-50"
              >
                {isUnenrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Disable 2FA
              </button>
            </div>
          ) : enrollFactorId ? (
            // Enrollment in progress — show QR code
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Smartphone className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Step 1:</strong> Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
                </div>
              </div>

              {qrUrl && (
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-white border-2 border-gray-200 rounded-2xl">
                    <img src={qrUrl} alt="QR Code for 2FA" width={240} height={240} className="rounded-lg" />
                  </div>
                  {secret && (
                    <div className="text-center">
                      <p className="text-xs text-gray-500 mb-1">Can't scan? Enter this code manually:</p>
                      <code className="text-sm font-mono bg-gray-100 px-3 py-1.5 rounded-lg text-gray-700 break-all">{secret}</code>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Shield className="w-5 h-5 text-brand-blue shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <strong>Step 2:</strong> Enter the 6-digit verification code from your authenticator app
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-lg font-mono tracking-widest outline-none focus:ring-2 focus:ring-brand-blue transition-all"
                  onKeyDown={(e) => { if (e.key === 'Enter' && verifyCode.length === 6) handleVerify(); }}
                />
                <button
                  onClick={handleVerify}
                  disabled={isVerifying || verifyCode.length !== 6}
                  className="bg-brand-blue text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isVerifying ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
                </button>
              </div>

              <button
                onClick={cancelEnrollment}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Cancel enrollment
              </button>
            </div>
          ) : (
            // 2FA not enabled — show enable button
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-5 bg-gray-50 border border-gray-200 rounded-xl">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900">2FA Not Enabled</h4>
                  <p className="text-xs text-gray-500 mt-1">
                    Protect your account with an authenticator app. You'll need a 6-digit code on every login.
                  </p>
                </div>
              </div>
              <button
                onClick={handleEnroll}
                disabled={isEnrolling}
                className="flex items-center gap-2 text-sm font-bold text-white bg-gray-900 hover:bg-black px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                {isEnrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                Enable 2FA
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityTab;
