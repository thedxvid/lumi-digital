import * as React from "react";
import { Home, MessageSquare, Mic, History, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

export function MobileBottomNav() {
  const links = [
    {
      label: "Início",
      href: "/app",
      icon: Home,
    },
    {
      label: "Chat",
      href: "/app/chat",
      icon: MessageSquare,
    },
    {
      label: "Voz",
      href: "/app/voice-chat",
      icon: Mic,
    },
    {
      label: "Histórico",
      href: "/app/history",
      icon: History,
    },
    {
      label: "Config",
      href: "/app/settings",
      icon: Settings,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 pb-safe">
      <div className="flex items-center justify-around px-1 py-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.href}
              to={link.href}
              end={link.href === "/app"}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 px-1.5 py-1.5 rounded-md transition-colors flex-1 max-w-[70px]",
                  isActive
                    ? "text-lumi-gold"
                    : "text-muted-foreground hover:text-foreground"
                )
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-[9px] font-medium leading-tight text-center">{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
