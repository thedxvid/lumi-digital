
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface SalesPromptPreviewProps {
  title: string
  content: string
  className?: string
}

export function SalesPromptPreview({ title, content, className }: SalesPromptPreviewProps) {
  if (!content.trim()) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="text-center text-muted-foreground">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Preencha os campos para ver a prévia</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Sparkles className="w-4 h-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="prose prose-sm max-w-none">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">
            {content}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
