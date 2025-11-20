import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ImageIcon, Sparkles, Edit } from 'lucide-react';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SlideConfig } from './CarouselConfigForm';

interface SlideConfigCardProps {
  slideNumber: number;
  slide: SlideConfig;
  onChange: (slide: SlideConfig) => void;
  disabled: boolean;
  uploadedImagesCount: number;
}

export function SlideConfigCard({ slideNumber, slide, onChange, disabled, uploadedImagesCount }: SlideConfigCardProps) {
  const [isOpen, setIsOpen] = useState(slideNumber === 1);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border bg-card">
        <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-accent/50 transition-colors">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              {slideNumber}
            </div>
            <span className="font-medium">
              Slide {slideNumber}
            </span>
          </div>
          <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="space-y-4 p-4 pt-0">
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Como Gerar a Imagem deste Slide
              </Label>
              
              <Select 
                value={slide.imageMode} 
                onValueChange={(value: any) => onChange({ ...slide, imageMode: value })}
                disabled={disabled}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="generate">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Gerar nova imagem com IA</span>
                    </div>
                  </SelectItem>
                  {uploadedImagesCount > 0 && (
                    <>
                      <SelectItem value="upload">
                        <div className="flex items-center gap-2">
                          <ImageIcon className="w-4 h-4" />
                          <span>Usar uma foto que enviei</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="generate-with-reference">
                        <div className="flex items-center gap-2">
                          <Edit className="w-4 h-4" />
                          <span>Gerar usando minhas fotos de referência</span>
                        </div>
                      </SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>

              {slide.imageMode === 'upload' && uploadedImagesCount > 0 && (
                <div className="space-y-2">
                  <Label>Qual foto usar?</Label>
                  <Select 
                    value={slide.uploadedImageIndex?.toString() || ''} 
                    onValueChange={(value) => onChange({ ...slide, uploadedImageIndex: parseInt(value) })}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma foto" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: uploadedImagesCount }).map((_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          Foto {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor={`slide-${slideNumber}-visual`}>
                  {slide.imageMode === 'upload' 
                    ? 'Efeitos/Ajustes (opcional)' 
                    : slide.imageMode === 'generate-with-reference'
                    ? 'Como devo me mostrar nesta imagem? *'
                    : 'Como deve ser a imagem? *'}
                </Label>
                <Textarea
                  id={`slide-${slideNumber}-visual`}
                  placeholder={
                    slide.imageMode === 'upload' 
                      ? 'Ex: adicione um filtro vintage, ajuste o brilho...' 
                      : slide.imageMode === 'generate-with-reference'
                      ? 'Ex: me coloque em Paris na frente da Torre Eiffel, com fundo desfocado...'
                      : 'Ex: fundo branco liso e minimalista, com elementos geométricos sutis...'
                  }
                  value={slide.visualInstruction}
                  onChange={(e) => onChange({ ...slide, visualInstruction: e.target.value })}
                  disabled={disabled}
                  className="min-h-[80px] resize-none"
                />
                {slide.imageMode === 'generate-with-reference' && (
                  <p className="text-xs text-muted-foreground">
                    A IA usará suas fotos enviadas como referência para manter sua identidade visual
                  </p>
                )}
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
