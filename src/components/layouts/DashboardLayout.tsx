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
        "flex flex-col md:flex-row bg-background w-full min-h-screen"
      )}>
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AnimatedDashboardSidebar />
        </div>
        
        {/* Main Content */}
        <main 
          className="flex-1 w-full h-screen pt-14 pb-16 md:pt-0 md:pb-0 transition-[padding] duration-300 md:pl-[var(--sidebar-width,72px)] overflow-hidden"
        >
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
