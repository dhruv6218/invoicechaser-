'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthLayout } from '../layouts/AuthLayout';
import { Loader2, AlertCircle, Sparkles, Eye, EyeOff, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getSupabaseBrowser } from '../lib/supabase-browser';

export const Login = () => {
  const router = useRouter();
  const { signIn, signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // MFA state
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState('');
  const [isVerifyingMfa, setIsVerifyingMfa] = useState(false);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    await signInWithGoogle();
    setIsGoogleLoading(false);
    router.push('/app');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setIsLoading(true);
    setError(null);
    
    const { error: signInError } = await signIn(email, password);
    setIsLoading(false);

    if (signInError) {
      setError(signInError);
      return;
    }

    // Check if MFA is required
    const supabase = getSupabaseBrowser();
    try {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.nextLevel === 'aal2' && aal?.currentLevel !== 'aal2') {
        // MFA required — list factors
        const { data: factorsData } = await supabase.auth.mfa.listFactors();
        const totpFactor = factorsData?.totp?.find((f: any) => f.status === 'verified');
        if (totpFactor) {
          setMfaFactorId(totpFactor.id);
          return; // Show MFA challenge UI
        }
      }
    } catch {
      // MFA check failed, proceed normally
    }

    router.push('/app');
  };

  const handleMfaVerify = async () => {
    if (!mfaFactorId || mfaCode.length !== 6) return;
    setIsVerifyingMfa(true);
    setError(null);

    const supabase = getSupabaseBrowser();
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: mfaFactorId,
      });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: challenge.id,
        code: mfaCode,
      });
      if (verifyError) throw verifyError;

      // MFA verified — redirect to app
      router.push('/app');
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsVerifyingMfa(false);
    }
  };

  return (
    <AuthLayout>
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-apple border border-gray-200 w-full animate-[fadeIn_0.5s_ease-out]">
        {mfaFactorId ? (
          // MFA Challenge UI
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-7 h-7 text-brand-blue" />
              </div>
              <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2 tracking-tight">Two-Factor Auth</h1>
              <p className="text-gray-500 text-sm font-medium">Enter the 6-digit code from your authenticator app.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => { if (e.key === 'Enter' && mfaCode.length === 6) handleMfaVerify(); }}
              placeholder="123456"
              className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-2xl rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-4 text-center font-mono tracking-[0.5em] transition-all duration-300 outline-none placeholder-gray-300 mb-4"
            />

            <button
              onClick={handleMfaVerify}
              disabled={isVerifyingMfa || mfaCode.length !== 6}
              className="w-full flex items-center justify-center text-white bg-brand-blue hover:bg-blue-700 disabled:bg-brand-blue/70 disabled:cursor-not-allowed font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-glow-blue btn-shine outline-none mt-2 h-[52px]"
            >
              {isVerifyingMfa ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Sign In'}
            </button>

            <button
              onClick={() => { setMfaFactorId(null); setMfaCode(''); setError(null); }}
              className="w-full text-sm text-gray-500 hover:text-gray-700 font-medium mt-4 transition-colors"
            >
              ← Back to login
            </button>
          </>
        ) : (
          // Normal Login UI
          <>
            <div className="text-center mb-8">
              <h1 className="font-heading text-3xl font-bold text-gray-900 mb-2 tracking-tight">Welcome back.</h1>
              <p className="text-gray-500 text-sm font-medium">Sign in to your Astrix workspace using your email & password.</p>
            </div>

            <button 
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isLoading}
              type="button"
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl hover:bg-gray-50 hover:border-brand-blue transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-blue/20 mb-6 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isGoogleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
              )}
              Continue with Google
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="h-[1px] bg-gray-200 flex-1"></div>
              <span className="text-[10px] text-gray-400 font-mono uppercase tracking-widest font-bold">or sign in with credentials</span>
              <div className="h-[1px] bg-gray-200 flex-1"></div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-700 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-1.5" htmlFor="email">Email Address</label>
                <input 
                  type="email" 
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-3.5 transition-all duration-300 outline-none placeholder-gray-400" 
                  placeholder="you@company.com" 
                  required 
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-sm font-bold text-gray-900" htmlFor="password">Password</label>
                  <Link href="/forgot-password" className="text-xs font-bold text-brand-blue hover:underline">Forgot password?</Link>
                </div>
                <div className="relative">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:bg-white focus:ring-4 focus:ring-brand-blue/20 focus:border-brand-blue block p-3.5 pr-11 transition-all duration-300 outline-none placeholder-gray-400" 
                    placeholder="••••••••" 
                    required 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading || !email || !password}
                className="w-full flex items-center justify-center text-white bg-brand-blue hover:bg-blue-700 disabled:bg-brand-blue/70 disabled:cursor-not-allowed focus-visible:ring-4 focus-visible:ring-brand-blue focus-visible:ring-offset-2 font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-glow-blue btn-shine outline-none mt-2 h-[52px]"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>
            </form>

            <p className="text-sm text-gray-500 font-medium text-center mt-8 mb-6">
              Don't have an account? <Link href="/signup" className="text-brand-blue font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue rounded-sm">Create account →</Link>
            </p>

            <div className="pt-6 border-t border-gray-100">
              <Link href="/app" className="w-full flex items-center justify-center gap-2 text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 font-bold rounded-xl text-sm px-5 py-4 transition-all shadow-sm outline-none focus-visible:ring-4 focus-visible:ring-gray-200">
                <Sparkles className="w-4 h-4 text-brand-blue" /> Instant Demo Access
              </Link>
            </div>
          </>
        )}
      </div>
    </AuthLayout>
  );
};

export default Login;
