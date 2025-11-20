import { GraduationCap, Video, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

const Tutorial = () => {
  const topics = [
    'Como criar criativos perfeitos',
    'Dominar o gerador de vídeos',
    'Análise de perfil avançada',
    'Dicas e truques exclusivos'
  ];

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 flex items-center justify-center min-h-[80vh]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <Card className="border-border/50 shadow-xl">
            <CardContent className="p-8 sm:p-12 text-center space-y-6">
              {/* Ícone principal */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="flex justify-center"
              >
                <div className="relative">
                  <div className="absolute inset-0 bg-lumi-gold/20 blur-2xl rounded-full" />
                  <GraduationCap className="h-20 w-20 text-lumi-gold relative" />
                </div>
              </motion.div>

              {/* Badge */}
              <div className="flex justify-center">
                <Badge variant="outline" className="border-lumi-gold text-lumi-gold px-4 py-1">
                  <Video className="h-3 w-3 mr-1" />
                  Em Breve
                </Badge>
              </div>

              {/* Título */}
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
                  Tutorial em Gravação
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                  Estamos preparando um conteúdo completo para você dominar todas as funcionalidades da LUMI
                </p>
              </div>

              {/* Lista de tópicos */}
              <div className="pt-6 space-y-3">
                {topics.map((topic, index) => (
                  <motion.div
                    key={topic}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.1 }}
                    className="flex items-center justify-center gap-3 text-foreground/80"
                  >
                    <CheckCircle className="h-5 w-5 text-lumi-gold flex-shrink-0" />
                    <span className="text-sm sm:text-base">{topic}</span>
                  </motion.div>
                ))}
              </div>

              {/* Mensagem final */}
              <p className="text-sm text-muted-foreground pt-4">
                📧 Você será notificado assim que o tutorial estiver disponível
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Tutorial;
