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
        "flex flex-col md:flex-row bg-background w-full h-screen"
      )}>
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AnimatedDashboardSidebar />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 w-full overflow-hidden pt-14 pb-14 md:pt-0 md:pb-0">
          <Outlet />
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
