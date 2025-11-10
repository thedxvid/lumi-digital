
import { InfoproductType } from '@/types/sales';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Book, PlayCircle, Presentation, FileText, CheckSquare, MapPin, Clock } from 'lucide-react';

interface InfoproductTypeSelectorProps {
  onSelectType: (type: InfoproductType) => void;
}

const infoproductTypes: InfoproductType[] = [
  {
    id: 'ebook',
    title: 'E-book',
    description: 'Livros digitais completos com estrutura profissional',
    icon: '📖',
    color: 'from-blue-500 to-blue-600',
    estimatedTime: '10-15 min',
    features: ['Estrutura de capítulos', 'Introdução e conclusão', 'Exercícios práticos', 'Design profissional']
  },
  {
    id: 'curso',
    title: 'Curso Online',
    description: 'Cursos estruturados em módulos e aulas progressivas',
    icon: '🎓',
    color: 'from-green-500 to-green-600',
    estimatedTime: '15-20 min',
    features: ['Módulos progressivos', 'Objetivos de aprendizagem', 'Atividades práticas', 'Sistema de avaliação']
  },
  {
    id: 'webinar',
    title: 'Webinar',
    description: 'Apresentações ao vivo com roteiro e slides estruturados',
    icon: '📹',
    color: 'from-purple-500 to-purple-600',
    estimatedTime: '8-12 min',
    features: ['Roteiro completo', 'Slides estruturados', 'Call-to-actions', 'Interações com público']
  },
  {
    id: 'template',
    title: 'Templates',
    description: 'Modelos práticos e aplicáveis para diferentes situações',
    icon: '📋',
    color: 'from-orange-500 to-orange-600',
    estimatedTime: '6-10 min',
    features: ['Modelos prontos', 'Instruções de uso', 'Exemplos práticos', 'Formatos editáveis']
  },
  {
    id: 'checklist',
    title: 'Checklist',
    description: 'Listas de verificação organizadas e acionáveis',
    icon: '✅',
    color: 'from-teal-500 to-teal-600',
    estimatedTime: '5-8 min',
    features: ['Itens organizados', 'Checkboxes interativos', 'Priorização clara', 'Fácil acompanhamento']
  },
  {
    id: 'guia',
    title: 'Guia Prático',
    description: 'Guias passo a passo detalhados e práticos',
    icon: '🗺️',
    color: 'from-red-500 to-red-600',
    estimatedTime: '12-18 min',
    features: ['Passos detalhados', 'Exemplos reais', 'Dicas práticas', 'Recursos complementares']
  }
];

const iconMap = {
  ebook: Book,
  curso: PlayCircle,
  webinar: Presentation,
  template: FileText,
  checklist: CheckSquare,
  guia: MapPin
};

export function InfoproductTypeSelector({ onSelectType }: InfoproductTypeSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          Escolha o Tipo de Infoproduto
        </h2>
        <p className="text-muted-foreground">
          Selecione o formato que melhor atende suas necessidades
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {infoproductTypes.map((type) => {
          const IconComponent = iconMap[type.id];
          
          return (
            <Card
              key={type.id}
              className="cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] border-2 hover:border-lumi-gold/50 group"
              onClick={() => onSelectType(type)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 bg-gradient-to-br ${type.color} rounded-lg flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      {type.icon}
                    </div>
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Clock className="w-3 h-3" />
                      {type.estimatedTime}
                    </Badge>
                  </div>

                  {/* Title and Description */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-lumi-gold transition-colors">
                      {type.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {type.description}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Recursos inclusos:
                    </p>
                    <ul className="space-y-1">
                      {type.features.slice(0, 3).map((feature, index) => (
                        <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-lumi-gold rounded-full flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Action Indicator */}
                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-lumi-gold font-medium group-hover:text-lumi-gold-dark transition-colors">
                      Clique para começar →
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
