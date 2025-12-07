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

interface ChangelogModalProps {
  trigger?: React.ReactNode;
}

export const ChangelogModal = ({ trigger }: ChangelogModalProps = {}) => {
  const [open, setOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const latestVersion = getLatestVersion();
  
  // Auto-open on new version (only when no trigger is provided)
  useEffect(() => {
    if (trigger) return; // Skip auto-open if trigger is provided
    
    const lastSeenVersion = localStorage.getItem(CHANGELOG_STORAGE_KEY);
    const sessionKey = 'lumi-changelog-shown-this-session';
    const shownThisSession = sessionStorage.getItem(sessionKey);
    
    // Only show if: new version AND not shown this session yet
    if (lastSeenVersion !== latestVersion.version && !shownThisSession) {
      // Small delay for better UX after login
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem(sessionKey, 'true');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [latestVersion.version, trigger]);
  
  const handleDismiss = () => {
    localStorage.setItem(CHANGELOG_STORAGE_KEY, latestVersion.version);
    setOpen(false);
    setShowHistory(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };
  
  return (
    <>
      {/* Trigger button (when provided) */}
      {trigger && (
        <div onClick={handleOpen} className="cursor-pointer">
          {trigger}
        </div>
      )}
      
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="relative w-full max-w-md"
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
        </div>
      )}
    </AnimatePresence>
    </>
  );
};
