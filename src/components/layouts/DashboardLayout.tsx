import { Outlet } from 'react-router-dom';
import { AnimatedDashboardSidebar } from '@/components/dashboard/AnimatedDashboardSidebar';
import { MobileHeader } from '@/components/dashboard/MobileHeader';
import { MobileBottomNav } from '@/components/dashboard/MobileBottomNav';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { cn } from '@/lib/utils';

const DashboardLayout = () => {
  return (
    <>
      {/* Mobile Header */}
      <MobileHeader />
      
      <div className={cn(
        "flex flex-col md:flex-row bg-background w-full h-screen overflow-hidden"
      )}>
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AnimatedDashboardSidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 w-full overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 pt-16 pb-16 md:pt-6 md:pb-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </>
  );
};

export default DashboardLayout;
