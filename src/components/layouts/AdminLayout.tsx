
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { RealTimeCostMonitor } from '@/components/admin/RealTimeCostMonitor';
import { 
  Users, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  LogOut, 
  Lightbulb,
  Activity,
  Home,
  Bot,
  Upload,
  DollarSign
} from 'lucide-react';

const AdminLayout = () => {
  const { signOut } = useAuth();
  const location = useLocation();

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/admin' },
    { icon: Users, label: 'Usuários', path: '/admin/users' },
    { icon: Upload, label: 'Importação', path: '/admin/bulk-import' },
    { icon: ShoppingCart, label: 'Pedidos', path: '/admin/orders' },
    { icon: Bot, label: 'Agentes', path: '/admin/agents' },
    { icon: Activity, label: 'Atividades', path: '/admin/logs' },
    { icon: DollarSign, label: 'Custos de API', path: '/admin/api-costs' },
    { icon: Settings, label: 'Configurações', path: '/admin/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <div className="w-64 bg-card border-r border-border flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-lumi-gold to-lumi-gold-dark rounded-full flex items-center justify-center">
              <Lightbulb className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">LUMI</h1>
              <p className="text-xs text-muted-foreground">Painel Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/app" className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors">
            <Home className="h-4 w-4" />
            Voltar ao App
          </Link>
          
          <div className="border-t border-border my-4"></div>
          
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-lumi-gold text-white'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            onClick={signOut}
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header with Real-Time Cost Monitor */}
        <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Painel Administrativo
          </div>
          <RealTimeCostMonitor />
        </div>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
