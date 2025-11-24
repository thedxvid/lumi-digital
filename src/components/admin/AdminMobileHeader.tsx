import { Menu, Lightbulb } from 'lucide-react';
import { RealTimeCostMonitor } from './RealTimeCostMonitor';
import { Button } from '@/components/ui/button';

interface AdminMobileHeaderProps {
  onMenuClick: () => void;
}

export function AdminMobileHeader({ onMenuClick }: AdminMobileHeaderProps) {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-lumi-gold to-lumi-gold-dark rounded-full flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">LUMI</h1>
              <p className="text-[10px] text-muted-foreground leading-none">Admin</p>
            </div>
          </div>
        </div>

        <RealTimeCostMonitor />
      </div>
    </header>
  );
}
