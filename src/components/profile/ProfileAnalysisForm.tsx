import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle, Sparkles } from 'lucide-react';
import type { ProfileAnalysisInput } from '@/types/profile';

interface ProfileAnalysisFormProps {
  onSubmit: (data: Omit<ProfileAnalysisInput, 'image'>) => void;
  loading: boolean;
}

export function ProfileAnalysisForm({ onSubmit, loading }: ProfileAnalysisFormProps) {
  const [formData, setFormData] = useState({
    niche: '',
    product: '',
    targetAudience: '',
    communication: '',
    goals: '',
    platform: 'Instagram' as const,
    profileType: 'Pessoal' as const,
    additionalNotes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="platform">Plataforma *</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Em qual rede social está o perfil que você quer analisar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select
            value={formData.platform}
            onValueChange={(value: any) => setFormData({ ...formData, platform: value })}
          >
            <SelectTrigger id="platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Instagram">Instagram</SelectItem>
              <SelectItem value="LinkedIn">LinkedIn</SelectItem>
              <SelectItem value="TikTok">TikTok</SelectItem>
              <SelectItem value="Twitter">Twitter/X</SelectItem>
              <SelectItem value="Facebook">Facebook</SelectItem>
              <SelectItem value="YouTube">YouTube</SelectItem>
              <SelectItem value="Outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="profileType">Tipo de Perfil *</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Classificação do perfil que está sendo analisado</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Select
            value={formData.profileType}
            onValueChange={(value: any) => setFormData({ ...formData, profileType: value })}
          >
            <SelectTrigger id="profileType">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pessoal">Pessoal</SelectItem>
              <SelectItem value="Marca">Marca</SelectItem>
              <SelectItem value="Influencer">Influencer</SelectItem>
              <SelectItem value="Empresa">Empresa</SelectItem>
              <SelectItem value="Serviço">Serviço</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="niche">Nicho/Segmento *</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Ex: Fitness, Negócios, Educação, Moda, etc.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          id="niche"
          value={formData.niche}
          onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
          placeholder="Ex: Marketing Digital"
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="product">Produto/Serviço *</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>O que você oferece ou promove neste perfil</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Input
          id="product"
          value={formData.product}
          onChange={(e) => setFormData({ ...formData, product: e.target.value })}
          placeholder="Ex: Consultoria de Marketing"
          required
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="targetAudience">Público-alvo *</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Descreva quem você quer alcançar com este perfil</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Textarea
          id="targetAudience"
          value={formData.targetAudience}
          onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
          placeholder="Ex: Empreendedores de 25-45 anos que querem crescer online"
          required
          maxLength={200}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="communication">Comunicação Atual *</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Como você se comunica atualmente no perfil</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Textarea
          id="communication"
          value={formData.communication}
          onChange={(e) => setFormData({ ...formData, communication: e.target.value })}
          placeholder="Ex: Informal, com memes e stories diários"
          required
          maxLength={200}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="goals">Objetivos Principais *</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>O que você quer alcançar com este perfil</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Textarea
          id="goals"
          value={formData.goals}
          onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
          placeholder="Ex: Aumentar vendas, construir autoridade, gerar leads"
          required
          maxLength={200}
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="additionalNotes">Observações Adicionais (opcional)</Label>
        <Textarea
          id="additionalNotes"
          value={formData.additionalNotes}
          onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
          placeholder="Qualquer informação extra que você acha relevante..."
          maxLength={500}
          rows={3}
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>Analisando Perfil...</>
        ) : (
          <>
            <Sparkles className="h-5 w-5 mr-2" />
            Analisar Perfil com IA
          </>
        )}
      </Button>
    </form>
  );
}
