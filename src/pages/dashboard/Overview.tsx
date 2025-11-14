import React from 'react';
import UsageDashboard from '@/components/dashboard/UsageDashboard';
import { UserStatsCard } from '@/components/dashboard/UserStatsCard';
import { WeeklyActivityChart } from '@/components/dashboard/WeeklyActivityChart';
import { QuickActions } from '@/components/dashboard/QuickActions';

const Overview = () => {
  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo de volta! 👋
          </h1>
          <p className="text-muted-foreground">
            Escolha um agente especializado e comece a criar com a LUMI
          </p>
        </div>

        {/* Suas Estatísticas */}
        <UserStatsCard />

        {/* Atividade Semanal */}
        <WeeklyActivityChart />

        {/* Seu Uso do Plano */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">Seu Uso do Plano</h2>
          <UsageDashboard />
        </div>

        {/* Ações Rápidas */}
        <QuickActions />
      </div>
    </div>
  );
};

export default Overview;
