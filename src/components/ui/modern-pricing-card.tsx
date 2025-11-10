
import React from 'react';
import { Check, Shield, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ModernPricingCardProps {
  originalPrice: number;
  currentPrice: number;
  installments: {
    count: number;
    value: number;
  };
  onGetStarted: () => void;
  className?: string;
}

export const ModernPricingCard: React.FC<ModernPricingCardProps> = ({
  originalPrice,
  currentPrice,
  installments,
  onGetStarted,
  className
}) => {
  const benefits = [
    "Acesso vitalício à LUMI",
    "Mais de 50 módulos especializados",
    "Suporte personalizado",
    "Atualizações gratuitas",
    "Comunidade exclusiva",
    "Templates prontos",
    "Garantia de 7 dias"
  ];

  return (
    <div className={cn("relative max-w-md mx-auto", className)}>
      {/* Glow effect background */}
      <div className="absolute -inset-1 bg-gradient-to-r from-lumi-gold via-lumi-gold-light to-lumi-gold rounded-3xl blur opacity-20 animate-pulse"></div>
      
      <Card className="relative bg-background border-2 border-lumi-gold/20 rounded-3xl p-8 shadow-2xl hover:shadow-[0_0_40px_rgba(249,168,37,0.3)] transition-all duration-500 hover:scale-[1.02]">
        {/* Limited offer badge */}
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full animate-pulse shadow-lg">
            🔥 OFERTA LIMITADA
          </Badge>
        </div>

        <div className="text-center space-y-6">
          {/* Pricing */}
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl text-muted-foreground line-through">
                R$ {originalPrice}
              </span>
              <span className="text-5xl font-bold bg-gradient-to-r from-lumi-gold to-lumi-gold-dark bg-clip-text text-transparent">
                R$ {currentPrice}
              </span>
            </div>
            <p className="text-xl text-lumi-gold-dark font-semibold">
              ou {installments.count}x de R$ {installments.value.toFixed(2)}
            </p>
            <p className="text-sm text-muted-foreground">
              sem juros no cartão
            </p>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onGetStarted}
            size="lg"
            className="w-full bg-gradient-to-r from-lumi-gold to-lumi-gold-dark hover:from-lumi-gold-dark hover:to-lumi-gold text-white text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(249,168,37,0.5)] transition-all duration-300 hover:scale-105"
          >
            🚀 Garantir Meu Acesso Agora
          </Button>

          {/* Benefits */}
          <div className="space-y-3 text-left">
            <h4 className="text-lg font-semibold text-center text-foreground mb-4">
              ✨ O que você vai receber:
            </h4>
            {benefits.map((benefit, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-5 h-5 bg-lumi-success rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-white" />
                </div>
                <span className="text-sm text-foreground">{benefit}</span>
              </div>
            ))}
          </div>

          {/* Trust indicators */}
          <div className="pt-4 border-t border-border">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="space-y-1">
                <Shield className="w-6 h-6 text-lumi-gold mx-auto" />
                <p className="text-xs text-muted-foreground">Garantia 7 dias</p>
              </div>
              <div className="space-y-1">
                <Clock className="w-6 h-6 text-lumi-gold mx-auto" />
                <p className="text-xs text-muted-foreground">Acesso imediato</p>
              </div>
              <div className="space-y-1">
                <Users className="w-6 h-6 text-lumi-gold mx-auto" />
                <p className="text-xs text-muted-foreground">+5.000 alunos</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
