import * as React from "react";
import { Lightbulb, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function MobileHeader() {
  const [open, setOpen] = React.useState(false);
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

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
    <header className="md:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-50 px-4 py-3 pt-safe">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gradient-to-br from-lumi-gold to-lumi-gold-dark rounded-full flex items-center justify-center">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-lg text-foreground">LUMI</span>
        </div>

        <div className="flex items-center gap-2">
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
