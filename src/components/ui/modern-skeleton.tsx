
import { cn } from "@/lib/utils"

function ModernSkeleton({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "card" | "text" | "avatar" | "button"
}) {
  const variants = {
    default: "skeleton rounded-md",
    card: "skeleton rounded-xl h-32 w-full",
    text: "skeleton rounded h-4",
    avatar: "skeleton rounded-full h-10 w-10",
    button: "skeleton rounded-lg h-10 w-24"
  }

  return (
    <div
      className={cn(variants[variant], className)}
      {...props}
    />
  )
}

function SkeletonCard() {
  return (
    <div className="glass-card rounded-xl p-6 space-y-4">
      <div className="flex items-center space-x-4">
        <ModernSkeleton variant="avatar" />
        <div className="space-y-2 flex-1">
          <ModernSkeleton variant="text" className="w-3/4" />
          <ModernSkeleton variant="text" className="w-1/2" />
        </div>
      </div>
      <ModernSkeleton variant="card" />
      <div className="flex justify-between">
        <ModernSkeleton variant="button" />
        <ModernSkeleton variant="button" />
      </div>
    </div>
  )
}

export { ModernSkeleton, SkeletonCard }
