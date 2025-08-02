"use client";

import { useEffect, useState } from 'react';
import { authClient } from '../lib/auth-client';

/**
 * Component to display current authentication status for debugging
 */
export default function AuthStatus() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const currentSession = await authClient.getSession();
        setSession(currentSession);
      } catch (error) {
        console.error('Auth status check error:', error);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="fixed top-4 right-4 bg-blue-100 border border-blue-300 rounded p-2 text-xs">
        Checking auth...
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="fixed top-4 right-4 bg-red-100 border border-red-300 rounded p-2 text-xs">
        Not authenticated
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 bg-green-100 border border-green-300 rounded p-2 text-xs">
      Logged in: {session.user.email}
    </div>
  );
} 