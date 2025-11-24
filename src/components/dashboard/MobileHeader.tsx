import * as React from "react";
import { Lightbulb, Menu, Home, MessageSquare, Images, History, Settings, BookUser, Video, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useNavigate, NavLink } from "react-router-dom";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";
import { MobileUsageLimitBar } from "./UsageLimitBar";

export function MobileHeader() {
  const [open, setOpen] = React.useState(false);
  const { signOut, user } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdminAuth();
  const navigate = useNavigate();

  const navigationLinks = [
    { label: "Visão Geral", href: "/app", icon: Home },
    { label: "Chat LUMI", href: "/app/chat", icon: MessageSquare },
    { label: "Meus Produtos", href: "/app/contexts", icon: BookUser },
    { label: "Máquina de Criativos", href: "/app/creative-engine", icon: Lightbulb },
    { label: "Carrosséis", href: "/app/carousel", icon: Images },
    { label: "Gerador de Vídeos", href: "/app/video-generator", icon: Video },
    { label: "Histórico", href: "/app/history", icon: History },
    { label: "Configurações", href: "/app/settings", icon: Settings },
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
    <header className="md:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-50 px-4 py-3 safe-top">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-br from-lumi-gold to-lumi-gold-dark rounded-full flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground">LUMI</span>
        </div>

        <div className="flex items-center gap-2">
          <MobileUsageLimitBar />
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-80 overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <div className="h-8 w-8 bg-gradient-to-br from-lumi-gold to-lumi-gold-dark rounded-full flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                LUMI
              </SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Navigation Links */}
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                  Navegação
                </p>
                {navigationLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.href}
                      to={link.href}
                      end={link.href === "/app"}
                      onClick={() => setOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                          isActive
                            ? "bg-lumi-gold/10 text-lumi-gold font-medium"
                            : "text-foreground hover:bg-muted"
                        )
                      }
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <span className="text-sm">{link.label}</span>
                    </NavLink>
                  );
                })}
              </div>

              {/* Admin Section */}
              {!adminLoading && isAdmin && (
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                    Administração
                  </p>
                  <NavLink
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                        isActive
                          ? "bg-lumi-gold/10 text-lumi-gold font-medium"
                          : "text-foreground hover:bg-muted"
                      )
                    }
                  >
                    <Shield className="h-5 w-5 flex-shrink-0" />
                    <span className="text-sm">Painel Admin</span>
                  </NavLink>
                </div>
              )}

              {/* User Info */}
              {user && (
                <div className="border-t border-border pt-4">
                  <div className="flex items-center gap-2 px-2 py-2 mb-2">
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
                  
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sair
                  </Button>
                </div>
              )}
            </div>
          </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
