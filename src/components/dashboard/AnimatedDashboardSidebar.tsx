import { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/animated-sidebar";
import { 
  Home, 
  MessageSquare, 
  Mic, 
  History, 
  Lightbulb,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function AnimatedDashboardSidebar() {
  const [open, setOpen] = useState(true);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const links = [
    {
      label: "Visão Geral",
      href: "/app",
      icon: (
        <Home className="text-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Chat LUMI",
      href: "/app/chat",
      icon: (
        <MessageSquare className="text-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Voz LUMI",
      href: "/app/voice-chat",
      icon: (
        <Mic className="text-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Máquina de Criativos",
      href: "/app/creative-engine",
      icon: (
        <Lightbulb className="text-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Histórico",
      href: "/app/history",
      icon: (
        <History className="text-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Configurações",
      href: "/app/settings",
      icon: (
        <Settings className="text-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Você saiu com sucesso!");
      navigate("/auth");
    } catch (error) {
      toast.error("Erro ao sair");
    }
  };

  return (
    <div className="relative h-full">
      {/* Botão discreto para toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="absolute -right-3 top-4 z-50 h-6 w-6 rounded-full bg-card border border-border shadow-md hover:bg-muted"
      >
        {open ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      <Sidebar open={open} setOpen={setOpen} animate={false}>
        <SidebarBody className="flex flex-col h-full justify-between gap-0 py-4">
          <div className="flex flex-col overflow-x-hidden overflow-y-auto flex-1 min-h-0">
            {open ? <Logo /> : <LogoIcon />}
            
            {/* Links principais */}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} end={link.href === "/app"} />
              ))}
            </div>
          </div>

          {/* User section e logout fixo no final */}
          <div className="space-y-2 border-t border-border pt-4 pb-4 flex-shrink-0">
            {/* Theme Toggle */}
            <div className={cn("flex py-2", open ? "justify-start px-2" : "justify-center")}>
              <ThemeToggle />
            </div>
            
            {user && open && (
              <div className="flex items-center gap-2 px-2 py-2">
                <div className="h-8 w-8 rounded-full bg-lumi-gold flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
            {user && !open && (
              <div className="flex items-center justify-center py-2">
                <div className="h-8 w-8 rounded-full bg-lumi-gold flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-semibold text-sm">
                    {user.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
            )}
            
            <button
              onClick={handleLogout}
              className={cn(
                "flex items-center gap-2 py-2 w-full text-foreground hover:bg-muted rounded-md transition-colors",
                open ? "justify-start px-2" : "justify-center"
              )}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {open && (
                <span className="text-sm">Sair</span>
              )}
            </button>
          </div>
        </SidebarBody>
      </Sidebar>
    </div>
  );
}

export const Logo = () => {
  return (
    <div className="font-normal flex space-x-2 items-center text-sm py-1 relative z-20">
      <div className="h-8 w-8 bg-gradient-to-br from-lumi-gold to-lumi-gold-dark rounded-full flex items-center justify-center flex-shrink-0">
        <Lightbulb className="h-5 w-5 text-white" />
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold text-xl text-foreground whitespace-pre"
      >
        LUMI
      </motion.span>
    </div>
  );
};

export const LogoIcon = () => {
  return (
    <div className="font-normal flex items-center justify-center text-sm py-1 relative z-20">
      <div className="h-8 w-8 bg-gradient-to-br from-lumi-gold to-lumi-gold-dark rounded-full flex items-center justify-center flex-shrink-0">
        <Lightbulb className="h-5 w-5 text-white" />
      </div>
    </div>
  );
};
