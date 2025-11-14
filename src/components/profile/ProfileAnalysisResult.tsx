import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  TrendingUp, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Target, 
  Calendar,
  Download,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import type { ProfileAnalysisOutput } from '@/types/profile';
import { exportProfileAnalysisToPDF } from '@/utils/profilePdfExporter';

interface ProfileAnalysisResultProps {
  result: ProfileAnalysisOutput;
  onClose?: () => void;
  platform?: string;
  profileImage?: string;
}

export function ProfileAnalysisResult({ result, onClose, platform, profileImage }: ProfileAnalysisResultProps) {
  // Helper para converter **texto** em <strong>texto</strong>
  const formatBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const getImpactColor = (impacto: string) => {
    switch (impacto) {
      case 'alto': return 'destructive';
      case 'medio': return 'default';
      case 'baixo': return 'secondary';
      default: return 'default';
    }
  };

  const getImpactLabel = (impacto: string) => {
    switch (impacto) {
      case 'alto': return 'Alto Impacto';
      case 'medio': return 'Médio Impacto';
      case 'baixo': return 'Baixo Impacto';
      default: return impacto;
    }
  };

  const handleExportPDF = () => {
    try {
      exportProfileAnalysisToPDF(result, platform, profileImage);
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumo Executivo */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Resumo Executivo</CardTitle>
                <CardDescription>Análise geral do perfil</CardDescription>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-3xl font-bold text-primary">{result.pontuacao_geral}</div>
              <div className="text-xs text-muted-foreground">Pontuação</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground leading-relaxed whitespace-pre-wrap">
            {formatBoldText(result.resumo_executivo)}
          </p>
        </CardContent>
      </Card>

      {/* Análise Visual */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            <CardTitle>Análise Visual</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 text-sm">📸 Foto de Perfil</h4>
            <p className="text-sm text-muted-foreground">{formatBoldText(result.analise_visual.foto_perfil)}</p>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2 text-sm">📝 Bio</h4>
            <p className="text-sm text-muted-foreground">{formatBoldText(result.analise_visual.bio)}</p>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2 text-sm">⭐ Destaques</h4>
            <p className="text-sm text-muted-foreground">{formatBoldText(result.analise_visual.destaques)}</p>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2 text-sm">🎨 Elementos Visuais</h4>
            <p className="text-sm text-muted-foreground">{formatBoldText(result.analise_visual.elementos_visuais)}</p>
          </div>
        </CardContent>
      </Card>

      {/* Pontos Fortes */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <CardTitle>Pontos Fortes</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {result.pontos_fortes.map((ponto, index) => (
              <li key={index} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-muted-foreground">{formatBoldText(ponto)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Pontos Cegos */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            <CardTitle>Pontos Cegos</CardTitle>
            <CardDescription>Oportunidades que você provavelmente não está vendo</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.pontos_cegos.map((ponto, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm">{ponto.titulo}</h4>
                <Badge variant={getImpactColor(ponto.impacto)}>
                  {getImpactLabel(ponto.impacto)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{formatBoldText(ponto.descricao)}</p>
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">💡 Solução:</p>
                <p className="text-sm text-muted-foreground">{formatBoldText(ponto.solucao)}</p>
              </div>
              {index < result.pontos_cegos.length - 1 && <Separator />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recomendações Prioritárias */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <CardTitle>Recomendações Prioritárias</CardTitle>
            <CardDescription>Ações de maior impacto</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {result.recomendacoes_prioritarias
            .sort((a, b) => a.prioridade - b.prioridade)
            .map((rec) => (
              <div key={rec.prioridade} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {rec.prioridade}
                  </div>
                  <div className="flex-1 space-y-2">
                    <h4 className="font-semibold">{formatBoldText(rec.acao)}</h4>
                    <p className="text-sm text-muted-foreground">{formatBoldText(rec.justificativa)}</p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        {rec.impacto_esperado}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {rec.tempo_implementacao}
                      </span>
                    </div>
                  </div>
                </div>
                {rec.prioridade < result.recomendacoes_prioritarias.length && <Separator />}
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Plano de Ação 30 Dias */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Plano de Ação 30 Dias</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(result.plano_acao_30_dias).map(([semana, acoes]) => (
              <div key={semana} className="space-y-2">
                <h4 className="font-semibold text-sm capitalize">
                  {semana.replace('_', ' ')}
                </h4>
                <ul className="space-y-1">
                  {acoes.map((acao, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{formatBoldText(acao)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Benchmarks */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Benchmarks e Tendências</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 text-sm">❌ O que falta no seu perfil</h4>
            <ul className="space-y-1">
              {result.benchmarks.o_que_falta.map((item, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-destructive">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <Separator />
          <div>
            <h4 className="font-semibold mb-2 text-sm">📈 Tendências para aproveitar</h4>
            <ul className="space-y-1">
              {result.benchmarks.tendencias.map((item, index) => (
                <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-primary">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      {onClose && (
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="default" className="flex-1" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      )}
    </div>
  );
}
