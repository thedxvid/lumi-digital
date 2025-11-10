import { Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
interface LumiLogoProps {
  size?: 'small' | 'medium' | 'large';
  variant?: 'full' | 'compact' | 'icon-only';
  showTagline?: boolean;
  animated?: boolean;
  className?: string;
}
export function LumiLogo({
  size = 'medium',
  variant = 'full',
  showTagline = false,
  animated = false,
  className
}: LumiLogoProps) {
  const sizeClasses = {
    small: {
      icon: 'w-8 h-8',
      iconInner: 'h-5 w-5',
      title: 'text-xl',
      tagline: 'text-xs'
    },
    medium: {
      icon: 'w-12 h-12',
      iconInner: 'h-7 w-7',
      title: 'text-2xl',
      tagline: 'text-sm'
    },
    large: {
      icon: 'w-16 h-16',
      iconInner: 'h-9 w-9',
      title: 'text-4xl',
      tagline: 'text-base'
    }
  };
  const currentSize = sizeClasses[size];
  const IconComponent = () => <div className={cn(currentSize.icon, "relative rounded-full flex items-center justify-center", "bg-lumi-gold", animated && "hover:scale-110 transition-all duration-300")}>
      <Lightbulb className={cn(currentSize.iconInner, "text-white")} />
    </div>;
  if (variant === 'icon-only') {
    return <IconComponent />;
  }
  return <div className={cn("flex items-center gap-2", className)}>
      <IconComponent />
      
      {(variant === 'full' || variant === 'compact') && <div className="flex flex-col">
          <h1 className={cn(currentSize.title, "font-bold text-foreground", "tracking-wide font-['Space_Grotesk',_sans-serif]")}>Lumi</h1>
          
          {showTagline && variant === 'full' && <p className={cn(currentSize.tagline, "text-muted-foreground")}>
              IA para Negócios Digitais
            </p>}
        </div>}
    </div>;
}