
import * as React from "react"
import { cn } from "@/lib/utils"

interface CharacterCounterProps {
  current: number
  max?: number
  min?: number
  className?: string
}

export function CharacterCounter({ current, max, min, className }: CharacterCounterProps) {
  const isOverMax = max && current > max
  const isUnderMin = min && current < min
  
  return (
    <div className={cn("text-sm text-muted-foreground", className)}>
      <span className={cn(
        isOverMax && "text-destructive",
        isUnderMin && "text-warning"
      )}>
        {current}
      </span>
      {max && <span>/{max}</span>}
      {min && !max && (
        <span className={cn(isUnderMin && "text-warning")}>
          {" "}(mín. {min})
        </span>
      )}
    </div>
  )
}
