'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStores';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              Welcome, {user.name}!
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              {user.email}
            </p>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="border-slate-300 dark:border-slate-700"
          >
            Logout
          </Button>
        </div>

        <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-semibold mb-4 text-slate-900 dark:text-slate-100">
            🎉 Authentication Successful!
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            You're now logged in. Your workspace and collections will be built here.
          </p>
        </Card>
      </div>
    </div>
  );
}