import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sparkles, Zap } from "lucide-react";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { cn } from "@/lib/utils";

interface ApiTierBadgeProps {
  className?: string;
  showTooltip?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ApiTierBadge({ className, showTooltip = true, size = 'md' }: ApiTierBadgeProps) {
  const { limits, loading } = useUsageLimits();

  if (loading || !limits) {
    return null;
  }

  const isPro = limits.api_tier === 'pro';
  const planType = limits.plan_type;

  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2'
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 14
  };

  const badge = (
    <Badge 
      variant={isPro ? "default" : "secondary"}
      className={cn(
        "font-medium flex items-center transition-all",
        isPro 
          ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-sm" 
          : "bg-muted text-muted-foreground",
        sizeClasses[size],
        className
      )}
    >
      {isPro ? (
        <Sparkles className="shrink-0" size={iconSizes[size]} />
      ) : (
        <Zap className="shrink-0" size={iconSizes[size]} />
      )}
      <span>{isPro ? 'PRO' : 'Standard'}</span>
    </Badge>
  );

  if (!showTooltip) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">
              {isPro ? '✨ API Nano Banana PRO' : '⚡ API Standard'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isPro 
                ? 'Você está usando a API Fal.ai Nano Banana PRO para geração de imagens de alta qualidade.'
                : 'Você está usando a API Lovable AI Gateway (gemini-2.5-flash-image-preview).'}
            </p>
            {planType === 'lumi' && (
              <p className="text-xs text-primary font-medium">
                Plano Lumi ativo
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
