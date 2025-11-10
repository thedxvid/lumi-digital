import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, History, TrendingUp, Sparkles
} from 'lucide-react';
import { RecentResultsWidget } from '@/components/sales/RecentResultsWidget';
import { SmartDashboard } from '@/components/dashboard/SmartDashboard';
import { GoalsTracker } from '@/components/dashboard/GoalsTracker';

const Overview = () => {
  const navigate = useNavigate();

  const quickStats = [
    {
      title: 'Agentes Disponíveis',
      value: '6',
      description: 'Especialistas em diferentes áreas',
      icon: Sparkles,
      color: 'text-purple-600'
    },
    {
      title: 'Com Geração de Imagens',
      value: '4',
      description: 'Agentes com capacidade de criar imagens',
      icon: TrendingUp,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Bem-vindo de volta! 👋
          </h1>
          <p className="text-muted-foreground">
            Escolha um agente especializado e comece a criar com a LUMI
          </p>
        </div>

        {/* Smart Dashboard com atividade recente */}
        <SmartDashboard />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickStats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
          
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/app/chat')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-purple-600">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Chat</p>
                  <p className="text-sm text-muted-foreground">Agentes IA</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Converse com os agentes LUMI</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/app/history')}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted text-orange-600">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">Histórico</p>
                  <p className="text-sm text-muted-foreground">Resultados</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Ver conversas anteriores</p>
            </CardContent>
          </Card>
        </div>

        {/* Metas do Usuário */}
        <GoalsTracker />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <RecentResultsWidget />
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">💼 Agente de Vendas</h3>
                  <p className="text-sm text-muted-foreground">
                    Especialista em estratégias de vendas, funis e técnicas de fechamento
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">📊 Agente de Marketing</h3>
                  <p className="text-sm text-muted-foreground">
                    Expert em campanhas, posicionamento e branding
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">✍️ Agente de Copy</h3>
                  <p className="text-sm text-muted-foreground">
                    Copywriter especialista em textos persuasivos
                  </p>
                </div>
                <Button 
                  className="w-full"
                  onClick={() => navigate('/app/chat')}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Começar a Conversar
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
