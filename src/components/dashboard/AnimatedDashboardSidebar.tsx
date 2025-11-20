import { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/animated-sidebar";
import { 
  Home, 
  MessageSquare, 
  History, 
  Lightbulb,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Images,
  Search,
  Video,
  TrendingUp,
  Shield,
  BookUser,
  Sparkles,
  HelpCircle,
  GraduationCap
} from "lucide-react";
import { SupportButton } from "@/components/ui/support-button";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { UsageLimitBarSidebar } from "./UsageLimitBarSidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function AnimatedDashboardSidebar() {
  const [open, setOpen] = useState(true);
  const [contentProductionOpen, setContentProductionOpen] = useState(true);
  const [supportOpen, setSupportOpen] = useState(false);
  const { signOut, user } = useAuth();
  const { isAdmin } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Inicializar CSS variable para padding do conteúdo
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--sidebar-width',
      open ? '300px' : '72px'
    );
  }, [open]);

  // Auto-expand content production if user is on one of those pages
  useEffect(() => {
    const contentProductionRoutes = [
      '/app/creative-engine',
      '/app/carousel',
      '/app/profile-analysis',
      '/app/video-generator'
    ];
    if (contentProductionRoutes.includes(location.pathname)) {
      setContentProductionOpen(true);
    }
  }, [location.pathname]);

  const mainLinks = [
    {
      label: "Visão Geral",
      href: "/app",
      icon: (
        <Home className="text-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Tutorial",
      href: "/app/tutorial",
      icon: (
        <GraduationCap className="text-foreground h-5 w-5 flex-shrink-0" />
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
      label: "Meus Produtos",
      href: "/app/contexts",
      icon: (
        <BookUser className="text-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  const contentProductionLinks = [
    {
      label: "Criativos",
      href: "/app/creative-engine",
      icon: (
        <Lightbulb className="text-foreground h-4 w-4 flex-shrink-0" />
      ),
    },
    {
      label: "Carrosséis",
      href: "/app/carousel",
      icon: (
        <Images className="text-foreground h-4 w-4 flex-shrink-0" />
      ),
    },
    {
      label: "Análise de Perfil",
      href: "/app/profile-analysis",
      icon: (
        <Search className="text-foreground h-4 w-4 flex-shrink-0" />
      ),
    },
    {
      label: "Gerador de Vídeos",
      href: "/app/video-generator",
      icon: (
        <Video className="text-foreground h-4 w-4 flex-shrink-0" />
      ),
    },
  ];

  const bottomLinks = [
    {
      label: "Histórico",
      href: "/app/history",
      icon: (
        <History className="text-foreground h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Suporte",
      href: "#",
      icon: (
        <HelpCircle className="text-foreground h-5 w-5 flex-shrink-0" />
      ),
      onClick: () => setSupportOpen(true),
    },
  ];

  const adminLinks = [
    {
      label: "Painel Admin",
      href: "/admin",
      icon: (
        <Shield className="text-foreground h-5 w-5 flex-shrink-0" />
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
    <>
      {/* Botão discreto para toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen(!open)}
        className="hidden md:flex fixed top-4 z-50 h-6 w-6 rounded-full bg-card border border-border shadow-md hover:bg-muted transition-[left] duration-300"
        style={{
          left: open ? 'calc(300px - 12px)' : 'calc(72px - 12px)'
        }}
      >
        {open ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>

      <Sidebar open={open} setOpen={setOpen} animate={false}>
        <SidebarBody className="flex flex-col justify-between gap-0 py-4">
          <div className="flex flex-col overflow-x-hidden overflow-y-auto flex-1 min-h-0">
            {open ? <Logo /> : <LogoIcon />}
            
            {/* Links principais */}
            <div className="mt-8 flex flex-col gap-2">
              {mainLinks.map((link, idx) => (
                <SidebarLink key={idx} link={link} end={link.href === "/app"} />
              ))}

              {/* Dropdown de Produção de Conteúdo */}
              {open ? (
                <Collapsible open={contentProductionOpen} onOpenChange={setContentProductionOpen}>
                  <CollapsibleTrigger asChild>
                    <button
                      className="flex items-center justify-between w-full px-2 py-2 rounded-md hover:bg-muted/50 transition-colors group"
                    >
                      <div className="flex items-center gap-2">
                        <Sparkles className="text-foreground h-5 w-5 flex-shrink-0" />
                        <span className="text-sm text-foreground font-medium">
                          Painel Criativo
                        </span>
                      </div>
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 text-muted-foreground transition-transform duration-200",
                          contentProductionOpen && "rotate-180"
                        )}
                      />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="ml-4 mt-1 space-y-1">
                    {contentProductionLinks.map((link, idx) => (
                      <SidebarLink key={`content-${idx}`} link={link} />
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setOpen(true)}
                        className="flex items-center justify-center w-full px-2 py-2 rounded-md hover:bg-muted/50 transition-colors"
                      >
                        <Sparkles className="text-foreground h-5 w-5 flex-shrink-0" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="z-50">
                      <p className="font-semibold mb-1">Produção de Conteúdo</p>
                      <ul className="text-xs space-y-1">
                        {contentProductionLinks.map((link, idx) => (
                          <li key={idx}>• {link.label}</li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {bottomLinks.map((link, idx) => 
                link.onClick ? (
                  <button
                    key={`bottom-${idx}`}
                    onClick={link.onClick}
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors w-full text-left"
                  >
                    {link.icon}
                    {open && <span className="text-sm text-foreground">{link.label}</span>}
                  </button>
                ) : (
                  <SidebarLink key={`bottom-${idx}`} link={link} />
                )
              )}
            </div>

            {/* Links de Admin */}
            {isAdmin && (
              <>
                {open && (
                  <div className="mt-6 mb-2 px-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Administração
                    </p>
                  </div>
                )}
                <div className="flex flex-col gap-2">
                  {adminLinks.map((link, idx) => (
                    <SidebarLink key={`admin-${idx}`} link={link} />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Limites de uso */}
          {open ? (
            <div className="border-t border-border pt-4 pb-2 px-2 flex-shrink-0">
              <UsageLimitBarSidebar />
            </div>
          ) : (
            <TooltipProvider>
              <div className="border-t border-border pt-3 pb-2 flex items-center justify-center flex-shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button 
                      onClick={() => setOpen(true)}
                      className="h-8 w-8 rounded-full bg-muted hover:bg-muted/80 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="max-w-xs">
                    <p className="font-semibold mb-1">Seus Limites</p>
                    <p className="text-xs text-muted-foreground">Clique para ver detalhes de uso</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          )}

          {/* User section e logout fixo no final */}
          <div className="space-y-2 border-t border-border pt-4 pb-4 flex-shrink-0">
            {/* Theme Toggle */}
            <div className={cn("flex py-2", open ? "justify-start px-2" : "justify-center")}>
              <ThemeToggle />
            </div>
            
            {/* User Profile - Click to Settings */}
            {user && open && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate('/app/settings')}
                      className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted/50 transition-colors w-full"
                    >
                      <div className="h-8 w-8 rounded-full bg-lumi-gold flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="overflow-hidden flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <Settings className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Abrir Configurações</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {user && !open && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => navigate('/app/settings')}
                      className="flex items-center justify-center py-2 rounded-md hover:bg-muted/50 transition-colors w-full"
                    >
                      <div className="h-8 w-8 rounded-full bg-lumi-gold flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-semibold text-sm">
                          {user.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Abrir Configurações</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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

      {/* Modal de Suporte (controlado pelo estado) */}
      <SupportButton 
        variant="inline"
        className="hidden"
        open={supportOpen}
        onOpenChange={setSupportOpen}
      />
    </>
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
