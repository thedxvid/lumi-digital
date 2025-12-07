import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Check, ChevronDown, ChevronUp, Rocket, Wrench, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { changelog, getLatestVersion, CHANGELOG_STORAGE_KEY, ChangelogEntry } from '@/data/changelog';
import { cn } from '@/lib/utils';

const typeConfig = {
  feature: {
    icon: Rocket,
    label: 'Novidade',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
  improvement: {
    icon: Sparkles,
    label: 'Melhoria',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  fix: {
    icon: Bug,
    label: 'Correção',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10'
  }
};

const ChangelogEntryCard = ({ entry, isLatest }: { entry: ChangelogEntry; isLatest: boolean }) => {
  const config = typeConfig[entry.type];
  const Icon = config.icon;
  
  return (
    <div className={cn(
      "p-4 rounded-lg border",
      isLatest ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"
    )}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md", config.bgColor)}>
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{entry.title}</span>
              {isLatest && (
                <Badge variant="default" className="text-xs px-1.5 py-0">
                  NOVO
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground">
              v{entry.version} • {new Date(entry.date).toLocaleDateString('pt-BR', { 
                day: 'numeric', 
                month: 'long', 
                year: 'numeric' 
              })}
            </span>
          </div>
        </div>
      </div>
      
      {entry.description && (
        <p className="text-sm text-muted-foreground mb-3">{entry.description}</p>
      )}
      
      <ul className="space-y-1.5">
        {entry.highlights.map((highlight, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm">
            <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
            <span className="text-foreground/90">{highlight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const ChangelogModal = () => {
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const latestVersion = getLatestVersion();
  
  useEffect(() => {
    const lastSeenVersion = localStorage.getItem(CHANGELOG_STORAGE_KEY);
    
    if (lastSeenVersion !== latestVersion.version) {
      // Small delay for better UX
      const timer = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [latestVersion.version]);
  
  const handleDismiss = () => {
    localStorage.setItem(CHANGELOG_STORAGE_KEY, latestVersion.version);
    setOpen(false);
    setShowHistory(false);
  };
  
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-br from-primary/20 via-primary/10 to-transparent p-6 pb-4">
                <button
                  onClick={handleDismiss}
                  className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-background/50 transition-colors"
                >
                  <X className="h-4 w-4 text-muted-foreground" />
                </button>
                
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-foreground">Novidades!</h2>
                    <p className="text-sm text-muted-foreground">
                      Veja o que há de novo na LUMI
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <ScrollArea className={showHistory ? "h-[350px]" : "h-auto max-h-[300px]"}>
                  <div className="space-y-3 pr-2">
                    <ChangelogEntryCard entry={latestVersion} isLatest={true} />
                    
                    {showHistory && changelog.slice(1).map((entry) => (
                      <ChangelogEntryCard key={entry.version} entry={entry} isLatest={false} />
                    ))}
                  </div>
                </ScrollArea>
                
                {changelog.length > 1 && (
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1 transition-colors"
                  >
                    {showHistory ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Ocultar histórico
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        Ver histórico ({changelog.length - 1} versões anteriores)
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {/* Footer */}
              <div className="p-4 pt-0">
                <Button 
                  onClick={handleDismiss} 
                  className="w-full"
                  size="lg"
                >
                  Entendi! 👍
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
