import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ImageIcon, Sparkles, Edit, Wand2, Loader2, Palette, RatioIcon } from 'lucide-react';
import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// RadioGroup removido - usando divs customizados para evitar conflitos de eventos
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SlideConfig } from './CarouselConfigForm';
import { cn } from '@/lib/utils';

// Formatos disponíveis para carrossel
const carouselFormats = [
  { value: 'square', label: '1:1 Quadrado', dimensions: '1080×1080' },
  { value: 'vertical', label: '4:5 Vertical', dimensions: '1080×1350' },
  { value: 'story-vertical', label: '9:16 Stories', dimensions: '1080×1920' },
  { value: 'horizontal', label: '16:9 Horizontal', dimensions: '1200×675' },
];

const uploadFormats = [
  { value: 'original', label: 'Manter Original', dimensions: 'Sem alteração' },
  ...carouselFormats,
];

const textColorOptions = [
  { value: '#FFFFFF', label: 'Branco', className: 'bg-white border border-gray-300' },
  { value: '#000000', label: 'Preto', className: 'bg-black' },
  { value: '#FFD700', label: 'Dourado', className: 'bg-yellow-500' },
  { value: '#FF6B6B', label: 'Vermelho', className: 'bg-red-400' },
  { value: '#4ECDC4', label: 'Turquesa', className: 'bg-teal-400' },
  { value: '#A855F7', label: 'Roxo', className: 'bg-purple-500' },
  { value: '#3B82F6', label: 'Azul', className: 'bg-blue-500' },
  { value: '#22C55E', label: 'Verde', className: 'bg-green-500' },
];

interface SlideConfigCardProps {
  slideNumber: number;
  slide: SlideConfig;
  onChange: (slide: SlideConfig) => void;
  disabled: boolean;
  uploadedImagesCount: number;
  showTextFields?: boolean;
}

export function SlideConfigCard({ slideNumber, slide, onChange, disabled, uploadedImagesCount, showTextFields = false }: SlideConfigCardProps) {
  const [isOpen, setIsOpen] = useState(slideNumber === 1);
  const [enhancing, setEnhancing] = useState(false);
  const [customColorInput, setCustomColorInput] = useState('');
  const [isChangingMode, setIsChangingMode] = useState(false);

  // Validate hex color
  const isValidHex = (hex: string) => /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
  
  const handleCustomColorChange = (value: string) => {
    // Auto-add # if not present
    let formatted = value.toUpperCase();
    if (formatted && !formatted.startsWith('#')) {
      formatted = '#' + formatted;
    }
    setCustomColorInput(formatted);
    
    if (isValidHex(formatted)) {
      onChange({ ...slide, textColor: formatted });
    }
  };

  const isCustomColor = slide.textColor && !textColorOptions.some(c => c.value === slide.textColor);

  const enhanceVisualPrompt = async () => {
    if (!slide.visualInstruction.trim()) return;
    
    setEnhancing(true);
    try {
      // Contexto especial para modo de referência (preservação de identidade)
      const context = slide.imageMode === 'generate-with-reference' 
        ? 'identity-preservation-carousel' 
        : 'carousel-slide';
      
      const { data, error } = await supabase.functions.invoke('enhance-prompt', {
        body: { prompt: slide.visualInstruction, context }
      });
      
      if (error) throw error;
      
      if (data?.enhancedPrompt) {
        onChange({ ...slide, visualInstruction: data.enhancedPrompt });
        toast.success('Prompt melhorado com instruções de preservação de identidade!');
      }
    } catch (error) {
      console.error('Error enhancing prompt:', error);
      toast.error('Erro ao melhorar prompt');
    } finally {
      setEnhancing(false);
    }
  };

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
              
              {/* Container customizado - sem RadioGroup para evitar conflitos de eventos */}
              <div className="grid grid-cols-1 gap-2">
                {/* Card: Gerar nova imagem */}
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isChangingMode || disabled) return;
                    
                    setIsChangingMode(true);
                    onChange({ ...slide, imageMode: 'generate', format: 'square' });
                    setTimeout(() => setIsChangingMode(false), 150);
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                    slide.imageMode === 'generate' 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50 hover:bg-accent/30",
                    disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {/* Indicador visual customizado */}
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    slide.imageMode === 'generate' 
                      ? "border-primary" 
                      : "border-muted-foreground"
                  )}>
                    {slide.imageMode === 'generate' && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="font-medium text-sm">Gerar nova imagem com IA</span>
                </div>

                {/* Card: Usar foto enviada */}
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isChangingMode || disabled) return;
                    if (uploadedImagesCount === 0) {
                      toast.error('Envie imagens primeiro para usar esta opção');
                      return;
                    }
                    
                    setIsChangingMode(true);
                    onChange({ ...slide, imageMode: 'upload', format: 'original' });
                    setTimeout(() => setIsChangingMode(false), 150);
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    slide.imageMode === 'upload' 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50 hover:bg-accent/30",
                    uploadedImagesCount === 0 || disabled
                      ? "opacity-50 cursor-not-allowed" 
                      : "cursor-pointer"
                  )}
                >
                  {/* Indicador visual customizado */}
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    slide.imageMode === 'upload' 
                      ? "border-primary" 
                      : "border-muted-foreground"
                  )}>
                    {slide.imageMode === 'upload' && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <ImageIcon className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">Usar uma foto que enviei</span>
                    {uploadedImagesCount === 0 && (
                      <span className="text-xs text-muted-foreground">(envie imagens primeiro)</span>
                    )}
                  </div>
                </div>

                {/* Card: Gerar usando referência */}
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isChangingMode || disabled) return;
                    if (uploadedImagesCount === 0) {
                      toast.error('Envie imagens primeiro para usar esta opção');
                      return;
                    }
                    
                    setIsChangingMode(true);
                    onChange({ ...slide, imageMode: 'generate-with-reference', format: 'square' });
                    setTimeout(() => setIsChangingMode(false), 150);
                  }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border transition-colors",
                    slide.imageMode === 'generate-with-reference' 
                      ? "border-primary bg-primary/10" 
                      : "border-border hover:border-primary/50 hover:bg-accent/30",
                    uploadedImagesCount === 0 || disabled
                      ? "opacity-50 cursor-not-allowed" 
                      : "cursor-pointer"
                  )}
                >
                  {/* Indicador visual customizado */}
                  <div className={cn(
                    "w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                    slide.imageMode === 'generate-with-reference' 
                      ? "border-primary" 
                      : "border-muted-foreground"
                  )}>
                    {slide.imageMode === 'generate-with-reference' && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <Edit className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">Gerar usando minhas fotos de referência</span>
                    {uploadedImagesCount === 0 && (
                      <span className="text-xs text-muted-foreground">(envie imagens primeiro)</span>
                    )}
                  </div>
                </div>
              </div>

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

              {/* Format Selector */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <RatioIcon className="w-4 h-4" />
                  Formato da Imagem
                </Label>
                <Select 
                  value={slide.format || (slide.imageMode === 'upload' ? 'original' : 'square')} 
                  onValueChange={(value) => onChange({ ...slide, format: value })}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(slide.imageMode === 'upload' ? uploadFormats : carouselFormats).map((format) => (
                      <SelectItem key={format.value} value={format.value}>
                        <div className="flex items-center justify-between gap-3">
                          <span>{format.label}</span>
                          <span className="text-xs text-muted-foreground">{format.dimensions}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {slide.imageMode === 'upload' && slide.format === 'original' && (
                  <p className="text-xs text-muted-foreground">
                    A imagem será usada com suas dimensões originais
                  </p>
                )}
              </div>

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
                
                {/* Botão Melhorar Prompt - aparece para modos de geração */}
                {(slide.imageMode === 'generate' || slide.imageMode === 'generate-with-reference') && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={enhanceVisualPrompt}
                      disabled={enhancing || !slide.visualInstruction.trim() || disabled}
                      className="gap-2"
                    >
                      {enhancing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                      {slide.imageMode === 'generate-with-reference' 
                        ? 'Melhorar Prompt (preservar identidade)'
                        : 'Melhorar Prompt'}
                    </Button>
                  </div>
                )}
                
                {slide.imageMode === 'generate-with-reference' && (
                  <p className="text-xs text-muted-foreground">
                    💡 Dica: Clique em "Melhorar Prompt" para adicionar automaticamente instruções de preservação facial e corporal
                  </p>
                )}
              </div>

              {/* Native Text Fields for PRO - shown for all image modes */}
              {showTextFields && (
                <div className="space-y-3 pt-3 border-t border-border">
                  <Label className="flex items-center gap-2 text-primary">
                    <Sparkles className="w-4 h-4" />
                    Texto Nativo (PRO) - Renderizado pela IA
                  </Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`slide-${slideNumber}-headline`} className="text-sm">Headline / Título</Label>
                      <span className="text-xs text-muted-foreground">{(slide.headline || '').length}/100</span>
                    </div>
                    <Input
                      id={`slide-${slideNumber}-headline`}
                      placeholder="Ex: Transforme seu negócio"
                      value={slide.headline || ''}
                      onChange={(e) => onChange({ ...slide, headline: e.target.value })}
                      disabled={disabled}
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`slide-${slideNumber}-secondary`} className="text-sm">Texto Secundário</Label>
                      <span className="text-xs text-muted-foreground">{(slide.secondaryText || '').length}/300</span>
                    </div>
                    <Input
                      id={`slide-${slideNumber}-secondary`}
                      placeholder="Ex: Com estratégias que funcionam"
                      value={slide.secondaryText || ''}
                      onChange={(e) => onChange({ ...slide, secondaryText: e.target.value })}
                      disabled={disabled}
                      maxLength={300}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={`slide-${slideNumber}-cta`} className="text-sm">Call to Action</Label>
                      <span className="text-xs text-muted-foreground">{(slide.ctaText || '').length}/40</span>
                    </div>
                    <Input
                      id={`slide-${slideNumber}-cta`}
                      placeholder="Ex: Saiba mais"
                      value={slide.ctaText || ''}
                      onChange={(e) => onChange({ ...slide, ctaText: e.target.value })}
                      disabled={disabled}
                      maxLength={40}
                    />
                  </div>
                  {/* Text Color Selector */}
                  <div className="space-y-3">
                    <Label className="flex items-center gap-2 text-sm">
                      <Palette className="w-4 h-4" />
                      Cor do Texto
                    </Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {textColorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => {
                            onChange({ ...slide, textColor: color.value });
                            setCustomColorInput('');
                          }}
                          disabled={disabled}
                          className={cn(
                            "w-8 h-8 rounded-full transition-all hover:scale-110 focus:outline-none",
                            color.className,
                            slide.textColor === color.value && "ring-2 ring-primary ring-offset-2",
                            !slide.textColor && color.value === '#FFFFFF' && "ring-2 ring-primary/50 ring-offset-1"
                          )}
                          title={color.label}
                        />
                      ))}
                      
                      {/* Custom color preview */}
                      {isCustomColor && (
                        <div
                          className="w-8 h-8 rounded-full ring-2 ring-primary ring-offset-2"
                          style={{ backgroundColor: slide.textColor }}
                          title={`Personalizada: ${slide.textColor}`}
                        />
                      )}
                    </div>
                    
                    {/* Custom color input with native picker */}
                    <div className="flex items-center gap-2">
                      {/* Native color picker */}
                      <input
                        type="color"
                        value={slide.textColor || '#FFFFFF'}
                        onChange={(e) => {
                          const color = e.target.value.toUpperCase();
                          onChange({ ...slide, textColor: color });
                          setCustomColorInput(color);
                        }}
                        disabled={disabled}
                        className="w-10 h-10 rounded cursor-pointer border border-border bg-transparent p-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Escolher cor"
                      />
                      
                      {/* Hex input */}
                      <div className="flex-1 relative">
                        <Input
                          placeholder="#FF5733"
                          value={customColorInput}
                          onChange={(e) => handleCustomColorChange(e.target.value)}
                          disabled={disabled}
                          maxLength={7}
                          className="font-mono text-sm"
                        />
                        {customColorInput && !isValidHex(customColorInput) && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-destructive">
                            Inválido
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      {slide.textColor 
                        ? `Cor: ${textColorOptions.find(c => c.value === slide.textColor)?.label || slide.textColor}` 
                        : 'Padrão: Branco com sombra'}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    O texto será renderizado diretamente na imagem pelo modelo Nano Banana PRO
                  </p>
                </div>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}