
import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TagInputProps {
  value?: string[]
  onChange?: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  className?: string
  disabled?: boolean
}

export function TagInput({
  value = [],
  onChange,
  placeholder = "Digite e pressione Enter para adicionar tags...",
  maxTags,
  className,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState("")

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault()
      if (maxTags && value.length >= maxTags) return
      
      const newTag = inputValue.trim()
      if (!value.includes(newTag)) {
        onChange?.([...value, newTag])
      }
      setInputValue("")
    }
    
    if (e.key === "Backspace" && !inputValue && value.length > 0) {
      onChange?.(value.slice(0, -1))
    }
  }

  const removeTag = (tagToRemove: string) => {
    onChange?.(value.filter(tag => tag !== tagToRemove))
  }

  return (
    <div className={cn("flex flex-wrap gap-2 p-2 border rounded-md bg-background", className)}>
      {value.map((tag) => (
        <Badge key={tag} variant="secondary" className="gap-1">
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:bg-destructive hover:text-destructive-foreground rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
        className="border-0 bg-transparent flex-1 min-w-[200px] focus-visible:ring-0 focus-visible:ring-offset-0"
        disabled={disabled || (maxTags ? value.length >= maxTags : false)}
      />
    </div>
  )
}
