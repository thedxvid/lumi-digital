import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UsageBarProps {
  label: string;
  current: number;
  limit: number;
  type?: 'daily' | 'monthly' | 'lifetime';
}

export const UsageBar = ({ label, current, limit, type = 'monthly' }: UsageBarProps) => {
  const percentage = limit > 0 ? (current / limit) * 100 : 0;
  const isWarning = percentage >= 80;
  const isDanger = percentage >= 95;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn(
          "font-medium",
          isDanger && "text-red-600 dark:text-red-400",
          isWarning && !isDanger && "text-yellow-600 dark:text-yellow-400",
          !isWarning && "text-muted-foreground"
        )}>
          {current}/{limit}
        </span>
      </div>
      <Progress 
        value={percentage} 
        className={cn(
          "h-1.5",
          isDanger && "[&>div]:bg-red-600 dark:[&>div]:bg-red-400",
          isWarning && !isDanger && "[&>div]:bg-yellow-600 dark:[&>div]:bg-yellow-400"
        )}
      />
    </div>
  );
};
