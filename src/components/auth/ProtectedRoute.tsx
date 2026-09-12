'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isInitializing } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isInitializing && !user) {
      router.push('/login');
    }
  }, [isInitializing, user, router]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand-blue mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-medium">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
