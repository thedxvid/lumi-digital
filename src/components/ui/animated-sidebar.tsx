import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  const { className, children, ...otherProps } = props;
  const childrenNode = children as React.ReactNode;
  return (
    <>
      <DesktopSidebar className={className} {...otherProps}>
        {childrenNode}
      </DesktopSidebar>
      <MobileSidebar className={className}>
        {childrenNode}
      </MobileSidebar>
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open } = useSidebar();
  return (
    <motion.div
      className={cn(
        "hidden md:flex md:flex-col bg-card border-r border-border flex-shrink-0 fixed left-0 top-0 h-screen overflow-y-auto z-30",
        open ? "px-4" : "px-2",
        className
      )}
      animate={{
        width: open ? "300px" : "72px",
      }}
      onAnimationComplete={() => {
        // Atualiza CSS variable quando animação termina
        document.documentElement.style.setProperty(
          '--sidebar-width',
          open ? '300px' : '72px'
        );
      }}
      style={{
        '--sidebar-width': open ? '300px' : '72px'
      } as React.CSSProperties}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => {
  return null; // Não é mais usado, substituído por MobileHeader e MobileBottomNav
};

export const SidebarLink = ({
  link,
  className,
  onClick,
  end = false,
  ...props
}: {
  link: Links;
  className?: string;
  onClick?: () => void;
  end?: boolean;
}) => {
  const { open } = useSidebar();
  return (
    <NavLink
      to={link.href}
      onClick={onClick}
      end={end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2 py-2 rounded-md transition-colors relative",
          open ? "justify-start px-2" : "justify-center px-0",
          isActive
            ? "bg-lumi-gold text-white"
            : "text-foreground hover:bg-muted",
          className
        )
      }
      {...props}
    >
      <div className="flex-shrink-0 flex items-center justify-center w-5 h-5">
        {link.icon}
      </div>
      <motion.span
        animate={{
          display: open ? "inline-block" : "none",
          opacity: open ? 1 : 0,
        }}
        className="text-sm whitespace-pre !p-0 !m-0"
      >
        {String(link.label)}
      </motion.span>
    </NavLink>
  );
};
