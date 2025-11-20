import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';
import { SupportModal } from './support-modal';
import { cn } from '@/lib/utils';

interface SupportButtonProps {
  variant?: 'floating' | 'inline' | 'header';
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const SupportButton = ({ 
  variant = 'floating', 
  className,
  open: controlledOpen,
  onOpenChange 
}: SupportButtonProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  if (variant === 'floating') {
    return (
      <>
        <Button
          onClick={() => setOpen(true)}
          className={cn(
            "fixed bottom-6 right-6 z-50 rounded-full shadow-lg h-14 px-6",
            "bg-primary hover:bg-primary/90 text-primary-foreground",
            "transition-all hover:scale-105",
            "flex items-center gap-2",
            className
          )}
          size="lg"
        >
          <HelpCircle className="h-5 w-5" />
          <span className="hidden sm:inline">Precisa de Ajuda?</span>
          <span className="sm:hidden">Suporte</span>
        </Button>
        <SupportModal open={open} onOpenChange={setOpen} />
      </>
    );
  }

  if (variant === 'header') {
    return (
      <>
        <Button
          onClick={() => setOpen(true)}
          variant="ghost"
          size="sm"
          className={cn("flex items-center gap-2", className)}
        >
          <HelpCircle className="h-4 w-4" />
          Suporte
        </Button>
        <SupportModal open={open} onOpenChange={setOpen} />
      </>
    );
  }

  // inline variant
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        variant="outline"
        className={cn("flex items-center gap-2", className)}
      >
        <HelpCircle className="h-4 w-4" />
        Falar com Suporte
      </Button>
      <SupportModal open={open} onOpenChange={setOpen} />
    </>
  );
};
