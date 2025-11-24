import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { AdminMobileHeader } from '@/components/admin/AdminMobileHeader';
import { AdminSidebarContent } from '@/components/admin/AdminSidebarContent';
import { RealTimeCostMonitor } from '@/components/admin/RealTimeCostMonitor';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row w-full">
      {/* Mobile Header - só no mobile */}
      {isMobile && (
        <AdminMobileHeader onMenuClick={() => setSidebarOpen(true)} />
      )}

      {/* Desktop Sidebar - só no desktop */}
      {!isMobile && (
        <aside className="w-64 bg-card border-r border-border">
          <AdminSidebarContent />
        </aside>
      )}

      {/* Mobile Sidebar - Sheet */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-80 p-0">
            <AdminSidebarContent onNavigate={() => setSidebarOpen(false)} />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header desktop - só desktop */}
        {!isMobile && (
          <div className="border-b border-border bg-card px-6 py-3 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Painel Administrativo
            </div>
            <RealTimeCostMonitor />
          </div>
        )}

        <main className="flex-1 overflow-auto pt-14 md:pt-0 pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
