import React from 'react';
import UsageDashboard from '@/components/dashboard/UsageDashboard';
import { UserStatsCard } from '@/components/dashboard/UserStatsCard';
import { WeeklyActivityChart } from '@/components/dashboard/WeeklyActivityChart';
import { QuickActions } from '@/components/dashboard/QuickActions';
import { useAuth } from '@/hooks/useAuth';

const Overview = () => {
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

  const userName = user?.user_metadata?.full_name
    || user?.email?.split('@')[0]
    || '';

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Greeting */}
        <div className="mb-10">
          <p className="text-sm font-medium text-muted-foreground/60 uppercase tracking-widest mb-1">
            {greeting}
          </p>
          <h1 className="font-space-grotesk text-2xl font-semibold tracking-tight text-foreground">
            {userName}
          </h1>
        </div>

        {/* Stats */}
        <UserStatsCard />

        {/* Chart + Usage — grid assimétrico */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <WeeklyActivityChart />
          </div>
          <div className="lg:col-span-2">
            <UsageDashboard />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-14">
          <QuickActions />
        </div>
      </div>
    </div>
  );
};

export default Overview;
