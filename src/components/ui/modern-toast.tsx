
import * as React from "react"
import { Toaster as Sonner } from "sonner"
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"

type ToastProps = React.ComponentProps<typeof Sonner>

const ModernToaster = ({ ...props }: ToastProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:glass-card group-[.toaster]:rounded-xl group-[.toaster]:border-border group-[.toaster]:text-foreground group-[.toaster]:shadow-lg group-[.toaster]:backdrop-blur-xl",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-2 group-[.toast]:font-medium group-[.toast]:transition-all group-[.toast]:hover:bg-primary/90",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg group-[.toast]:px-3 group-[.toast]:py-2 group-[.toast]:font-medium group-[.toast]:transition-all group-[.toast]:hover:bg-muted/80",
        },
      }}
      {...props}
    />
  )
}

const showSuccessToast = (message: string) => {
  return (window as any).sonner?.success(message, {
    icon: <CheckCircle className="w-4 h-4 text-green-500" />,
  })
}

const showErrorToast = (message: string) => {
  return (window as any).sonner?.error(message, {
    icon: <XCircle className="w-4 h-4 text-red-500" />,
  })
}

const showWarningToast = (message: string) => {
  return (window as any).sonner?.warning(message, {
    icon: <AlertCircle className="w-4 h-4 text-yellow-500" />,
  })
}

const showInfoToast = (message: string) => {
  return (window as any).sonner?.info(message, {
    icon: <Info className="w-4 h-4 text-blue-500" />,
  })
}

export { 
  ModernToaster, 
  showSuccessToast, 
  showErrorToast, 
  showWarningToast, 
  showInfoToast 
}
