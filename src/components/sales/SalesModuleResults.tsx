import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Copy, Save, MessageSquare, BookOpen, Clock, Target, CheckCircle2, Lightbulb, Users, Calendar, Brain, Shield, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

interface SalesModuleResultsProps {
  moduleId: string;
  results: any;
  onSaveAsset: (asset: any) => void;
  onSendToChat: (prompt: string) => void;
}

// Função utilitária para converter qualquer valor em string de forma segura
function safeStringify(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'string') {
    return value;   
  }
  
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value, null, 2);
    } catch (error) {
      console.error('Error stringifying object:', error);
      return '[Object - cannot display]';
    }
  }
  
  return String(value);
}

// Função para formatar resultados de objection-breaking
function formatObjectionBreakingResult(result: any): { 
  objection: string; 
  response: string; 
  additionalInfo?: string 
} {
  console.log('🔧 Formatando resultado objection-breaking:', result);
  
  // Nova estrutura: {value, empathy, reframe, nextStep, socialProof}
  if (result.value) {
    const formatted = {
      objection: 'Objeção identificada',
      response: safeStringify(result.value),
      additionalInfo: ''
    };
    
    const additionalParts = [];
    if (result.empathy) additionalParts.push(`**Empatia:** ${safeStringify(result.empathy)}`);
    if (result.reframe) additionalParts.push(`**Reenquadramento:** ${safeStringify(result.reframe)}`);
    if (result.nextStep) additionalParts.push(`**Próximo Passo:** ${safeStringify(result.nextStep)}`);
    if (result.socialProof) additionalParts.push(`**Prova Social:** ${safeStringify(result.socialProof)}`);
    
    if (additionalParts.length > 0) {
      formatted.additionalInfo = additionalParts.join('\n\n');
    }
    
    return formatted;
  }
  
  // Estrutura antiga: {real_objection, response}
  if (result.real_objection || result.response) {
    return {
      objection: safeStringify(result.real_objection || 'Objeção identificada'),
      response: safeStringify(result.response || 'Resposta não disponível')
    };
  }
  
  // Fallback para outros formatos
  return {
    objection: 'Resultado de quebra de objeção',
    response: safeStringify(result)
  };
}

export function SalesModuleResults({ moduleId, results, onSaveAsset, onSendToChat }: SalesModuleResultsProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Log para debugging
  console.log('🎯 SalesModuleResults renderizando:', { moduleId, results });

  const copyToClipboard = async (text: string, index?: number) => {
    try {
      // Garantir que text é sempre string
      const safeText = safeStringify(text);
      await navigator.clipboard.writeText(safeText);
      if (index !== undefined) {
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
      }
      toast.success('Copiado para a área de transferência!');
    } catch (error) {
      toast.error('Erro ao copiar texto');
    }
  };

  const handleSave = (title: string, content: string, type: string) => {
    // Garantir que content é sempre string
    const safeContent = safeStringify(content);
    onSaveAsset({
      title,
      content: safeContent,
      asset_type: type,
      module_used: moduleId,
      input_data: results
    });
  };

  // Renderizar resultados de diagnóstico de leads
  const renderLeadDiagnosisResults = () => {
    if (!results.temperature && !results.diagnosis) return null;

    return (
      <div className="space-y-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-blue-600">
                Diagnóstico do Lead
              </CardTitle>
              <Badge variant={results.temperature === 'quente' ? 'default' : results.temperature === 'morno' ? 'secondary' : 'outline'}>
                🌡️ {results.temperature?.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Diagnóstico:</h4>
              <p className="text-sm leading-relaxed">{safeStringify(results.diagnosis)}</p>
            </div>
            
            {results.recommendations && results.recommendations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4" />
                  Recomendações:
                </h4>
                <ul className="space-y-2">
                  {results.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {safeStringify(rec)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.nextActions && results.nextActions.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Próximas Ações:
                </h4>
                <ul className="space-y-2">
                  {results.nextActions.map((action: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      {safeStringify(action)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`${safeStringify(results.diagnosis)}\n\nRecomendações:\n${results.recommendations?.map((r: any) => safeStringify(r)).join('\n')}\n\nPróximas ações:\n${results.nextActions?.map((a: any) => safeStringify(a)).join('\n')}`)}
                className="gap-1"
              >
                <Copy className="w-3 h-3" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave('Diagnóstico de Lead', `${safeStringify(results.diagnosis)}\n\nRecomendações:\n${results.recommendations?.map((r: any) => safeStringify(r)).join('\n')}\n\nPróximas ações:\n${results.nextActions?.map((a: any) => safeStringify(a)).join('\n')}`, 'copy')}
                className="gap-1"
              >
                <Save className="w-3 h-3" />
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar resultados de rotina de vendas
  const renderSalesRoutineResults = () => {
    if (!results.routine && !results.focusAreas) return null;

    return (
      <div className="space-y-6">
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader>
            <CardTitle className="text-xl text-indigo-600 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Rotina de Vendas Personalizada
            </CardTitle>
            {results.totalTime && (
              <p className="text-sm text-muted-foreground">
                Tempo total estimado: {results.totalTime}
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {results.routine && results.routine.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Cronograma Diário:</h4>
                <div className="space-y-3">
                  {results.routine.map((item: any, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                      <Badge variant="outline" className="min-w-fit">
                        {item.time}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.task}</p>
                        {item.priority && (
                          <Badge variant={item.priority >= 8 ? 'destructive' : item.priority >= 5 ? 'default' : 'secondary'} className="text-xs">
                            Prioridade {item.priority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {results.focusAreas && results.focusAreas.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Áreas de Foco:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {results.focusAreas.map((area: string, index: number) => (
                    <Badge key={index} variant="secondary">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`Rotina de Vendas:\n\n${results.routine?.map((item: any) => `${item.time} - ${item.task}`).join('\n')}\n\nÁreas de foco: ${results.focusAreas?.join(', ')}`)}
                className="gap-1"
              >
                <Copy className="w-3 h-3" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave('Rotina de Vendas', `Rotina de Vendas:\n\n${results.routine?.map((item: any) => `${item.time} - ${item.task}`).join('\n')}\n\nÁreas de foco: ${results.focusAreas?.join(', ')}`, 'roteiro')}
                className="gap-1"
              >
                <Save className="w-3 h-3" />
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar resultados de quebra de objeções
  const renderObjectionBreakingResults = () => {
    console.log('🛡️ Renderizando objection-breaking results:', results);
    
    // Verificar se temos dados para renderizar
    if (!results || (typeof results === 'object' && Object.keys(results).length === 0)) {
      console.log('❌ Nenhum resultado válido para objection-breaking');
      return null;
    }

    // Formatar o resultado usando nossa função auxiliar
    const formatted = formatObjectionBreakingResult(results);
    
    console.log('✅ Resultado formatado:', formatted);

    return (
      <div className="space-y-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader>
            <CardTitle className="text-xl text-green-600 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Quebra de Objeção
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-red-50 border-l-4 border-red-200 p-4 rounded-r-lg">
              <h4 className="font-semibold text-red-800 mb-2">Objeção Identificada:</h4>
              <p className="text-sm text-red-700">{formatted.objection}</p>
            </div>
            
            <div className="bg-green-50 border-l-4 border-green-200 p-4 rounded-r-lg">
              <h4 className="font-semibold text-green-800 mb-2">Resposta Recomendada:</h4>
              <p className="text-sm text-green-700 leading-relaxed whitespace-pre-wrap">{formatted.response}</p>
            </div>

            {formatted.additionalInfo && (
              <div className="bg-blue-50 border-l-4 border-blue-200 p-4 rounded-r-lg">
                <h4 className="font-semibold text-blue-800 mb-2">Informações Adicionais:</h4>
                <div className="text-sm text-blue-700 leading-relaxed whitespace-pre-wrap">{formatted.additionalInfo}</div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`Objeção: ${formatted.objection}\n\nResposta:\n${formatted.response}${formatted.additionalInfo ? `\n\n${formatted.additionalInfo}` : ''}`)}
                className="gap-1"
              >
                <Copy className="w-3 h-3" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave('Quebra de Objeção', `Objeção: ${formatted.objection}\n\nResposta:\n${formatted.response}${formatted.additionalInfo ? `\n\n${formatted.additionalInfo}` : ''}`, 'copy')}
                className="gap-1"
              >
                <Save className="w-3 h-3" />
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar resultados de pesquisa de público
  const renderAudienceResearchResults = () => {
    if (!results.target_audience && !results.demographics) return null;

    return (
      <div className="space-y-6">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="text-xl text-purple-600 flex items-center gap-2">
              <Users className="w-5 h-5" />
              Pesquisa de Público-Alvo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Público-alvo principal */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Público-Alvo Principal:</h4>
              <p className="text-sm leading-relaxed">{results.target_audience}</p>
            </div>

            {/* Demografia */}
            {results.demographics && (
              <div>
                <h4 className="font-semibold mb-3">Demografia:</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(results.demographics).map(([key, value]) => (
                    <div key={key} className="bg-muted/20 p-3 rounded">
                      <p className="text-xs font-medium text-muted-foreground uppercase">{key.replace('_', ' ')}</p>
                      <p className="text-sm">{value as string}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Personas */}
            {results.personas && results.personas.length > 0 && (
              <div>
                <h4 className="font-semibold mb-3">Personas Identificadas:</h4>
                <div className="space-y-3">
                  {results.personas.map((persona: any, index: number) => (
                    <Card key={index}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{persona.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{persona.description}</p>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {persona.goals && persona.goals.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">OBJETIVOS:</p>
                            <div className="flex flex-wrap gap-1">
                              {persona.goals.map((goal: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">{goal}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {persona.challenges && persona.challenges.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">DESAFIOS:</p>
                            <div className="flex flex-wrap gap-1">
                              {persona.challenges.map((challenge: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">{challenge}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Canais recomendados */}
            {results.recommended_channels && results.recommended_channels.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Canais Recomendados:</h4>
                <div className="flex flex-wrap gap-2">
                  {results.recommended_channels.map((channel: string, index: number) => (
                    <Badge key={index} variant="default">{channel}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}
                className="gap-1"
              >
                <Copy className="w-3 h-3" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave('Pesquisa de Público', JSON.stringify(results, null, 2), 'copy')}
                className="gap-1"
              >
                <Save className="w-3 h-3" />
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar resultados de mindset
  const renderMindsetResults = () => {
    if (!results.message && !results.affirmations) return null;

    return (
      <div className="space-y-6">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader>
            <CardTitle className="text-xl text-purple-600 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Boost de Mindset
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {results.message && (
              <div className="bg-purple-50 border-l-4 border-purple-200 p-4 rounded-r-lg">
                <h4 className="font-semibold text-purple-800 mb-2">Mensagem Motivacional:</h4>
                <p className="text-sm text-purple-700 leading-relaxed">{results.message}</p>
              </div>
            )}

            {results.affirmations && results.affirmations.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Afirmações Positivas:</h4>
                <ul className="space-y-2">
                  {results.affirmations.map((affirmation: string, index: number) => (
                    <li key={index} className="flex items-start gap-2 text-sm bg-muted/20 p-2 rounded">
                      <CheckCircle2 className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      {affirmation}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {results.action && (
              <div className="bg-green-50 border-l-4 border-green-200 p-4 rounded-r-lg">
                <h4 className="font-semibold text-green-800 mb-2">Ação Recomendada:</h4>
                <p className="text-sm text-green-700">{results.action}</p>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(`${results.message}\n\nAfirmações:\n${results.affirmations?.join('\n')}\n\nAção: ${results.action}`)}
                className="gap-1"
              >
                <Copy className="w-3 h-3" />
                Copiar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave('Boost de Mindset', `${results.message}\n\nAfirmações:\n${results.affirmations?.join('\n')}\n\nAção: ${results.action}`, 'copy')}
                className="gap-1"
              >
                <Save className="w-3 h-3" />
                Salvar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Função para renderizar resultados de infoprodutos
  const renderInfoproductResults = () => {
    if (!results.title && !results.structure) return null;

    return (
      <div className="space-y-6">
        {/* Header do Infoproduto */}
        <Card className="border-l-4 border-l-lumi-gold">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-xl text-lumi-gold-dark">
                  {results.title || 'Infoproduto Criado'}
                </CardTitle>
                {results.targetAudience && (
                  <Badge variant="secondary" className="gap-1">
                    <Target className="w-3 h-3" />
                    {results.targetAudience}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                {results.estimatedPages && (
                  <Badge variant="outline" className="gap-1">
                    <BookOpen className="w-3 h-3" />
                    {results.estimatedPages} páginas
                  </Badge>
                )}
                {results.estimatedDuration && (
                  <Badge variant="outline" className="gap-1">
                    <Clock className="w-3 h-3" />
                    {results.estimatedDuration}
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tópicos Principais */}
        {results.keyTopics && results.keyTopics.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Principais Tópicos Abordados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2">
                {results.keyTopics.map((topic: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{topic}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Estrutura/Conteúdo Principal */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Estrutura Completa</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(results.structure || results.content)}
                  className="gap-1"
                >
                  <Copy className="w-3 h-3" />
                  Copiar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave(
                    results.title || 'Infoproduto',
                    results.structure || results.content,
                    mapProductTypeToAssetType(results.productType)
                  )}
                  className="gap-1"
                >
                  <Save className="w-3 h-3" />
                  Salvar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div 
                className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/30 p-4 rounded-lg border"
                style={{ fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Monaco, Consolas, monospace' }}
              >
                {results.structure || results.content}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos Passos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3">
              <Button
                variant="outline"
                onClick={() => onSendToChat(`Com base no ${results.title || 'infoproduto'} que acabei de criar, preciso de orientações sobre como validar esse conteúdo no mercado e definir estratégias de lançamento.`)}
                className="justify-start gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                Estratégias de Lançamento
              </Button>
              <Button
                variant="outline"
                onClick={() => onSendToChat(`Como posso criar uma página de vendas eficaz para o ${results.title || 'meu infoproduto'}? Preciso de orientações sobre copy, estrutura e elementos de conversão.`)}
                className="justify-start gap-2"
              >
                <Target className="w-4 h-4" />
                Página de Vendas
              </Button>
              <Button
                variant="outline"
                onClick={() => onSendToChat(`Ajude-me a criar uma estratégia de preço para o ${results.title || 'meu infoproduto'} considerando meu público-alvo e o valor entregue.`)}
                className="justify-start gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Estratégia de Preço
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar outros tipos de resultados - ATUALIZADO com proteção
  const renderOtherResults = () => {
    if (results.copies) {
      return (
        <div className="space-y-4">
          {results.copies.map((copy: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{safeStringify(copy.title)}</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(copy.content, index)}
                    >
                      {copiedIndex === index ? 'Copiado!' : 'Copiar'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSave(safeStringify(copy.title), safeStringify(copy.content), copy.type || 'copy')}
                    >
                      Salvar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{safeStringify(copy.content)}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (results.strategies) {
      return (
        <div className="space-y-4">
          {results.strategies.map((strategy: any, index: number) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    {safeStringify(strategy.title)}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{safeStringify(strategy.timing)}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-sm">{safeStringify(strategy.content)}</p>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(strategy.content, index)}
                  >
                    {copiedIndex === index ? 'Copiado!' : 'Copiar'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleSave(safeStringify(strategy.title), safeStringify(strategy.content), 'copy')}
                  >
                    Salvar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (results.timeline) {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Target className="w-5 h-5" />
                Plano de Lançamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(results.timeline).map(([phase, actions]) => (
                <div key={phase}>
                  <h4 className="font-semibold mb-2 capitalize">{phase.replace('_', '-')}</h4>
                  <div className="space-y-2">
                    {(actions as any[]).map((action: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                        <Badge variant="outline">Dia {safeStringify(action.day)}</Badge>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{safeStringify(action.action)}</p>
                          <p className="text-xs text-muted-foreground mt-1">{safeStringify(action.content)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(safeStringify(results.timeline))}
                >
                  Copiar Plano
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSave('Plano de Lançamento', safeStringify(results.timeline), 'roteiro')}
                >
                  Salvar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Fallback para resultados não estruturados - PROTEGIDO
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="bg-muted/30 p-4 rounded border">
            <p className="text-sm text-muted-foreground mb-2">Resultado:</p>
            <pre className="whitespace-pre-wrap text-sm">
              {safeStringify(results)}
            </pre>
          </div>
          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(results)}
            >
              Copiar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSave('Resultado Lumi', safeStringify(results), 'copy')}
            >
              Salvar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Função auxiliar para mapear tipo de produto para tipo de asset
  const mapProductTypeToAssetType = (productType: string) => {
    const mapping: Record<string, string> = {
      'ebook': 'copy',
      'curso': 'roteiro',
      'webinar': 'roteiro',
      'template': 'copy',
      'checklist': 'copy',
      'guia': 'roteiro'
    };
    return mapping[productType] || 'copy';
  };

  // Renderizar baseado no tipo de módulo
  const renderResults = () => {
    console.log('🎨 Rendering results for module:', moduleId, 'Results:', results);
    
    switch (moduleId) {
      case 'lead-diagnosis':
        return renderLeadDiagnosisResults();
      case 'sales-routine':
        return renderSalesRoutineResults();
      case 'objection-breaking':
        return renderObjectionBreakingResults();
      case 'pesquisa-publico':
        return renderAudienceResearchResults();
      case 'mindset':
        return renderMindsetResults();
      case 'infoproduct-generator':
        return renderInfoproductResults();
      default:
        return renderOtherResults();
    }
  };

  return (
    <div className="space-y-6">
      {renderResults()}
    </div>
  );
}
