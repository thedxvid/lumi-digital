import { Home, MessageSquare, Mic, History, BookUser, Shield } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { useEffect } from 'react';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DashboardSidebar({
  isOpen,
  onClose
}: DashboardSidebarProps) {
  const location = useLocation();
  const { isAdmin, loading } = useAdminAuth();
  
  useEffect(() => {
    console.log('🔧 [DashboardSidebar] Admin Status Changed:', { 
      isAdmin, 
      loading, 
      shouldShowAdmin: !loading && isAdmin,
      timestamp: new Date().toISOString()
    });
  }, [isAdmin, loading]);
  
  const mainNavigation = [{
    name: 'Visão Geral',
    href: '/app',
    icon: Home,
    current: location.pathname === '/app'
  }, {
    name: 'Chat LUMI',
    href: '/app/chat',
    icon: MessageSquare,
    current: location.pathname === '/app/chat'
  }, {
    name: 'Converse com a LUMI',
    href: '/app/voice-chat',
    icon: Mic,
    current: location.pathname === '/app/voice-chat'
  }, {
    name: 'Agentes',
    href: '/app/contexts',
    icon: BookUser,
    current: location.pathname === '/app/contexts'
  }, {
    name: 'Histórico',
    href: '/app/history',
    icon: History,
    current: location.pathname === '/app/history'
  }];


  return <>
      {/* Overlay for mobile/tablet */}
      {isOpen && <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar - Aumentada a largura */}
      <aside className={`
        fixed top-14 left-0 bottom-0 w-80 bg-background border-r border-border z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:top-0 lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Navigation */}
          <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
            {/* Menu Section */}
            <div className="mb-6">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Menu
              </div>
              <ul className="space-y-1 sm:space-y-2 mt-2">
                {mainNavigation.map(item => 
                  <li key={item.name}>
                    <NavLink 
                      to={item.href} 
                      onClick={() => {
                        // Close sidebar on mobile after navigation
                        if (window.innerWidth < 1024) {
                          onClose();
                        }
                      }} 
                      className={({isActive}) => 
                        `group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                          isActive 
                            ? 'bg-lumi-gold text-white' 
                            : 'text-foreground hover:text-foreground hover:bg-muted'
                        }`
                      } 
                      end={item.href === '/app'}
                    >
                      <item.icon className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-current" />
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">{item.name}</span>
                    </NavLink>
                  </li>
                )}
              </ul>
            </div>

            {/* Admin Section */}
            {!loading && isAdmin && (
              <div className="mb-6 mt-6 pt-6 border-t border-border">
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administração
                </div>
                <ul className="space-y-1 sm:space-y-2 mt-2">
                  <li>
                    <NavLink 
                      to="/admin" 
                      onClick={() => {
                        if (window.innerWidth < 1024) {
                          onClose();
                        }
                      }} 
                      className={({isActive}) => 
                        `group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                          isActive 
                            ? 'bg-lumi-gold text-white' 
                            : 'text-foreground hover:text-foreground hover:bg-muted'
                        }`
                      }
                    >
                      <Shield className="mr-3 h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 text-current" />
                      <span className="whitespace-nowrap overflow-hidden text-ellipsis">Painel Admin</span>
                    </NavLink>
                  </li>
                </ul>
              </div>
            )}
          </nav>
        </div>
      </aside>
    </>;
}
