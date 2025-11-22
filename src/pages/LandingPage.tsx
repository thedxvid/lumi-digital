import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, Star, TrendingUp, Users, Zap, Shield, Play, Clock, Award, BarChart3, Target, Lightbulb, Rocket, Menu, X, Search, Magnet, RotateCcw, Brain, Book, Calendar, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TypewriterText } from '@/components/ui/typewriter-text';
import { ModernPricingCard } from '@/components/ui/modern-pricing-card';
import { FAQSection } from '@/components/ui/faq-section';
import { AnimatedCard } from '@/components/ui/animated-card';
import { LumiLogo } from '@/components/ui/lumi-logo';
import { FallingPattern } from '@/components/ui/falling-pattern';
import { useNavigate } from 'react-router-dom';
import { useScrollHeader } from '@/hooks/useScrollHeader';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import mockupLumi from '@/assets/mockup_lumi.png';
const LandingPage = () => {
  const navigate = useNavigate();
  const isScrolled = useScrollHeader(100);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 44,
    seconds: 14
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return {
            ...prev,
            seconds: prev.seconds - 1
          };
        } else if (prev.minutes > 0) {
          return {
            ...prev,
            minutes: prev.minutes - 1,
            seconds: 59
          };
        } else if (prev.hours > 0) {
          return {
            hours: prev.hours - 1,
            minutes: 59,
            seconds: 59
          };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const handleGetStarted = () => {
    navigate('/auth');
  };
  const handleLoginRedirect = () => {
    navigate('/app');
    setMobileMenuOpen(false);
  };
  const handleInstallApp = () => {
    navigate('/install');
    setMobileMenuOpen(false);
  };
  const typewriterWords = ["Conhecimento em Renda", "Ideias em Negócios", "Habilidades em Lucro", "Experiência em Dinheiro"];
  const problemSolutions = [{
    problem: "Sem ideias de negócio digital",
    solution: "IA gera 100+ ideias personalizadas",
    icon: <Lightbulb className="h-8 w-8" />
  }, {
    problem: "Não sabe por onde começar",
    solution: "Roadmap passo-a-passo personalizado",
    icon: <Target className="h-8 w-8" />
  }, {
    problem: "Falta de conhecimento técnico",
    solution: "Automações sem código necessário",
    icon: <Zap className="h-8 w-8" />
  }, {
    problem: "Medo de não dar certo",
    solution: "Validação antes de investir tempo",
    icon: <Shield className="h-8 w-8" />
  }];
  const features = [{
    title: "Gerador de Ideias IA",
    description: "Receba ideias de negócio personalizadas baseadas no seu perfil, experiência e mercado atual.",
    icon: <Lightbulb className="h-8 w-8" />,
    highlight: true
  }, {
    title: "Validador de Mercado",
    description: "Analise a viabilidade da sua ideia antes de investir tempo e dinheiro no projeto.",
    icon: <Target className="h-8 w-8" />,
    highlight: false
  }, {
    title: "Plano de Ação Completo",
    description: "Roadmap detalhado com todas as etapas para tirar sua ideia do papel e começar a faturar.",
    icon: <Rocket className="h-8 w-8" />,
    highlight: true
  }, {
    title: "Diagnóstico de Leads",
    description: "Analise comportamental de leads para identificar temperatura e momento ideal de abordagem.",
    icon: <Search className="h-8 w-8" />,
    highlight: false
  }, {
    title: "Quebra de Objeções",
    description: "Scripts personalizados para superar objeções específicas do seu nicho e produto.",
    icon: <Shield className="h-8 w-8" />,
    highlight: false
  }, {
    title: "Captação de Leads",
    description: "Estratégias e ferramentas para atrair e capturar leads qualificados no seu negócio.",
    icon: <Magnet className="h-8 w-8" />,
    highlight: true
  }, {
    title: "Gerador de Infoprodutos",
    description: "Crie infoprodutos completos com estrutura, conteúdo e estratégias de venda personalizadas.",
    icon: <Book className="h-8 w-8" />,
    highlight: false
  }, {
    title: "Rotina de Vendas",
    description: "Sistema completo para organizar e otimizar sua rotina de vendas e follow-up.",
    icon: <Calendar className="h-8 w-8" />,
    highlight: true
  }];
  const socialProof = [{
    metric: "R$ 2.8M+",
    label: "Faturados por usuários"
  }, {
    metric: "87%",
    label: "Taxa de sucesso"
  }, {
    metric: "30 dias",
    label: "Tempo médio para 1ª venda"
  }, {
    metric: "324%",
    label: "ROI médio em 90 dias"
  }];
  const faqs = [{
    question: "A LUMI realmente funciona para iniciantes?",
    answer: "Sim! 73% dos nossos usuários nunca tinham vendido nada online. Nossa IA foi desenvolvida especificamente para quem está começando do zero."
  }, {
    question: "Quanto tempo leva para ver resultados?",
    answer: "A maioria dos usuários consegue sua primeira venda em até 30 dias seguindo o plano de ação da LUMI. Alguns conseguem em menos de 7 dias."
  }, {
    question: "Preciso investir dinheiro para começar?",
    answer: "Não! A LUMI ensina estratégias que funcionam sem investimento inicial. Você pode começar apenas com seu conhecimento e dedicação."
  }, {
    question: "A LUMI funciona para qualquer área?",
    answer: "Sim! Já ajudamos pessoas de mais de 50 nichos diferentes: saúde, fitness, culinária, negócios, relacionamentos, finanças e muito mais."
  }];
  return <div className="min-h-screen bg-background overflow-x-hidden">
      {/* HEADER COMPLETO */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-background/95 backdrop-blur-sm border-b border-border/50' : 'bg-background/80'}`}>
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo apenas "Lumi" sem subtítulo */}
            <LumiLogo size="medium" variant="compact" animated className="hover:scale-105 transition-transform duration-300" />
            
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <ThemeToggle className="hidden sm:flex" />
              
              {/* Desktop login button */}
              <Button variant="ghost" onClick={handleLoginRedirect} className="hidden sm:flex text-sm px-4 py-2 rounded-full hover:bg-lumi-gold/10 hover:text-lumi-gold-dark transition-all duration-300">Login</Button>
              
              {/* Mobile menu button - mais clicável */}
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden min-w-[44px] min-h-[44px] p-2 hover:bg-lumi-gold/10 transition-all duration-300 rounded-xl">
                <div className="relative w-6 h-6 flex flex-col justify-center items-center">
                  <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-0.5' : '-translate-y-1'}`}></span>
                  <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                  <span className={`block w-5 h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-0.5' : 'translate-y-1'}`}></span>
                </div>
              </Button>
              
              {/* CTA com gradiente e sombra */}
              <Button onClick={handleGetStarted} className="rounded-full bg-gradient-to-r from-lumi-gold to-amber-500 hover:from-amber-500 hover:to-lumi-gold text-black font-semibold text-sm px-6 py-3 shadow-lg shadow-lumi-gold/30 hover:shadow-xl hover:shadow-lumi-gold/40 hover:scale-105 transition-all duration-300 min-h-[44px]">Começar</Button>
            </div>
          </div>
          
          {/* Mobile menu melhorado */}
          {mobileMenuOpen && <div className="sm:hidden mt-4 pb-4 border-t border-lumi-gold/10 animate-fade-in">
              <div className="flex flex-col space-y-3 pt-4">
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm text-muted-foreground">Tema</span>
                  <ThemeToggle />
                </div>
                <Button 
                  variant="ghost" 
                  onClick={handleInstallApp} 
                  className="justify-start text-left px-4 py-3 rounded-lg hover:bg-lumi-gold/10 hover:text-lumi-gold-dark transition-all duration-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Instalar App
                </Button>
                <Button variant="ghost" onClick={handleLoginRedirect} className="justify-start text-left px-4 py-3 rounded-lg hover:bg-lumi-gold/10 hover:text-lumi-gold-dark transition-all duration-300">
                  Já tenho acesso
                </Button>
              </div>
            </div>}
        </div>
      </header>

      {/* HERO SECTION COM FALLING PATTERN */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-4 overflow-hidden">
        {/* Falling Pattern Background */}
        <div className="absolute inset-0 z-0">
          <FallingPattern 
            color="hsl(var(--lumi-gold))"
            backgroundColor="hsl(var(--background))"
            duration={100}
            blurIntensity="0.5em"
            density={1.5}
            className="h-full w-full"
          />
        </div>

        {/* Gradiente overlay sutil para melhor legibilidade */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-background/30 via-transparent to-background/50"></div>

        <div className="container mx-auto text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 leading-tight">
            Transforme
            <span className="block bg-gradient-to-r from-lumi-gold via-amber-500 to-lumi-gold-dark bg-clip-text text-transparent">
              <TypewriterText words={typewriterWords} speed={100} />
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-4 max-w-4xl mx-auto leading-relaxed px-4">
            A primeira IA especializada em transformar seu conhecimento em um negócio digital lucrativo.
          </p>
          <p className="text-lg sm:text-xl md:text-2xl text-foreground font-semibold mb-10 max-w-4xl mx-auto px-4">
            Mesmo que você nunca tenha vendido nada online.
          </p>
        </div>
      </section>

      {/* DASHBOARD PREVIEW SECTION - MOBILE OTIMIZADO */}
      <section className="relative -mt-8 md:-mt-16 px-4 mb-16">
        <div className="container mx-auto max-w-7xl">
          <img 
            src={mockupLumi} 
            alt="Dashboard LUMI - Interface da plataforma" 
            className="w-full h-auto animate-fade-in"
            loading="eager"
          />
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-8 sm:py-12 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {socialProof.map((item, index) => <AnimatedCard key={index} delay={index * 100} className="p-4 sm:p-6 text-center bg-background">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-lumi-gold mb-2">{item.metric}</div>
                <div className="text-xs sm:text-sm text-muted-foreground">{item.label}</div>
              </AnimatedCard>)}
          </div>
        </div>
      </section>

      {/* PROBLEM/SOLUTION */}
      <section className="py-12 sm:py-16 md:py-24 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-6">
              87% das pessoas têm conhecimento valioso...
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              mas não sabem como transformar isso em renda digital
            </p>
            <div className="text-4xl sm:text-6xl mb-4">📈</div>
            <p className="text-base sm:text-lg text-lumi-gold-dark font-semibold">
              Mercado de infoprodutos: R$ 2,3 bilhões em 2024
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {problemSolutions.map((item, index) => <AnimatedCard key={index} delay={index * 150} className="p-6 sm:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl flex items-center justify-center text-red-600 flex-shrink-0">
                    ❌
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">{item.problem}</h3>
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-border">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-lumi-gold/20 to-amber-500/20 rounded-xl flex items-center justify-center text-lumi-gold-dark flex-shrink-0">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-lumi-gold-dark mb-2">{item.solution}</h3>
                    </div>
                  </div>
                </div>
              </AnimatedCard>)}
          </div>
        </div>
      </section>

      {/* FEATURES - EXPANDIDAS */}
      <section className="py-12 sm:py-16 md:py-24 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-6">
              Ferramentas Poderosas. Infinitas Possibilidades.
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground">
              Tudo que você precisa para sair do zero e faturar online
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {features.map((feature, index) => <AnimatedCard key={index} delay={index * 100} className={`p-6 sm:p-8 h-full transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer ${feature.highlight ? 'ring-2 ring-lumi-gold/20 bg-gradient-to-br from-lumi-gold/5 to-transparent' : 'hover:bg-muted/50'}`}>
                <div className="text-lumi-gold-dark mb-6 flex justify-center">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-center">
                  {feature.description}
                </p>
                {feature.highlight && <div className="mt-4 text-center">
                    <Badge className="bg-lumi-gold/10 text-lumi-gold-dark text-xs">
                      Mais Popular
                    </Badge>
                  </div>}
              </AnimatedCard>)}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-12 sm:py-16 md:py-24 px-4 bg-gradient-to-br from-muted/50 to-background">
        <div className="container mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-6">
              Escolha Seu Plano
            </h2>
            <p className="text-lg sm:text-xl text-muted-foreground mb-8">
              Transforme seu conhecimento em renda digital com a LUMI
            </p>
          </div>
          
          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Plano Básico */}
            <Card className="relative border-2 border-border hover:border-lumi-gold/50 transition-all duration-300 p-6 sm:p-8">
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-foreground mb-2">Plano Básico</h3>
                  <p className="text-sm text-muted-foreground">Perfeito para começar sua jornada</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-3xl font-bold text-lumi-gold">R$ 97</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Plano mensal</p>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 bg-muted/30 rounded-lg text-left">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold">3 meses</span>
                        <Badge variant="secondary" className="text-xs">Economize 21%</Badge>
                      </div>
                      <p className="text-xl font-bold text-lumi-gold">R$ 77/mês</p>
                      <p className="text-xs text-muted-foreground">Total: R$ 231</p>
                    </div>

                    <div className="p-3 bg-lumi-gold/5 rounded-lg border border-lumi-gold/20 text-left">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold">6 meses</span>
                        <Badge className="bg-lumi-gold text-black text-xs">Economize 31%</Badge>
                      </div>
                      <p className="text-xl font-bold text-lumi-gold">R$ 67/mês</p>
                      <p className="text-xs text-muted-foreground">Total: R$ 402</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-left pt-4 border-t border-border">
                  {[
                    'Chat ilimitado com IA',
                    '10 imagens criativas/dia',
                    '300 imagens/mês',
                    '5 análises de perfil/dia',
                    '150 análises/mês',
                    '3 carrosséis/mês',
                    'Suporte prioritário',
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-lumi-gold flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 opacity-50">
                    <span className="text-sm text-muted-foreground line-through">Geração de vídeos</span>
                  </div>
                </div>

                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-muted to-muted/80 hover:from-lumi-gold/20 hover:to-lumi-gold/10 text-foreground"
                >
                  Começar Agora
                </Button>
              </div>
            </Card>

            {/* Plano PRO */}
            <Card className="relative border-2 border-lumi-gold/50 hover:border-lumi-gold transition-all duration-300 p-6 sm:p-8 shadow-lg shadow-lumi-gold/10">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-lumi-gold to-amber-500 text-black px-4 py-1 text-sm font-semibold">
                  ⭐ MAIS POPULAR
                </Badge>
              </div>

              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-lumi-gold mb-2">Plano PRO</h3>
                  <p className="text-sm text-muted-foreground">Para profissionais que precisam de mais poder</p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-lumi-gold/10 rounded-lg border border-lumi-gold/30">
                    <div className="flex items-baseline justify-center gap-2">
                      <span className="text-3xl font-bold text-lumi-gold">R$ 197</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Plano mensal</p>
                  </div>

                  <div className="space-y-2">
                    <div className="p-3 bg-lumi-gold/5 rounded-lg text-left border border-lumi-gold/20">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold">3 meses</span>
                        <Badge className="bg-lumi-gold/20 text-lumi-gold-dark text-xs">Economize 20%</Badge>
                      </div>
                      <p className="text-xl font-bold text-lumi-gold">R$ 157/mês</p>
                      <p className="text-xs text-muted-foreground">Total: R$ 471</p>
                    </div>

                    <div className="p-3 bg-lumi-gold/10 rounded-lg border-2 border-lumi-gold/40 text-left">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-semibold">6 meses</span>
                        <Badge className="bg-gradient-to-r from-lumi-gold to-amber-500 text-black text-xs">Economize 30%</Badge>
                      </div>
                      <p className="text-xl font-bold text-lumi-gold">R$ 137/mês</p>
                      <p className="text-xs text-muted-foreground">Total: R$ 822</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-left pt-4 border-t border-lumi-gold/20">
                  {[
                    'Tudo do Plano Básico',
                    '30 imagens criativas/dia',
                    '900 imagens/mês',
                    '10 análises de perfil/dia',
                    '300 análises/mês',
                    '10 carrosséis/mês',
                    '15 vídeos/mês (até 8s, 1080p)',
                    'Suporte VIP',
                    'Acesso antecipado',
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-lumi-gold flex-shrink-0" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  onClick={handleGetStarted}
                  className="w-full bg-gradient-to-r from-lumi-gold to-amber-500 hover:from-amber-500 hover:to-lumi-gold text-black font-semibold shadow-lg shadow-lumi-gold/30"
                >
                  Começar com PRO
                </Button>
              </div>
            </Card>
          </div>

          {/* Add-ons Info */}
          <div className="mt-12 text-center">
            <Card className="max-w-2xl mx-auto p-6 bg-muted/30">
              <h4 className="font-semibold text-lg mb-4 text-foreground">
                🎬 Precisa de mais vídeos?
              </h4>
              <p className="text-sm text-muted-foreground mb-4">
                Usuários PRO podem comprar pacotes extras de vídeos:
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <div className="text-center">
                  <p className="font-bold text-lumi-gold">+10 vídeos</p>
                  <p className="text-xs text-muted-foreground">R$ 59,90</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lumi-gold">+20 vídeos</p>
                  <p className="text-xs text-muted-foreground">R$ 99,90</p>
                </div>
                <div className="text-center">
                  <p className="font-bold text-lumi-gold">+30 vídeos</p>
                  <p className="text-xs text-muted-foreground">R$ 129,90</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQSection faqs={faqs} />

      {/* CTA FINAL */}
      <section className="relative py-12 sm:py-20 px-4 bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
        {/* Efeitos de brilho */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-64 h-64 sm:w-96 sm:h-96 bg-lumi-gold/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 sm:w-80 sm:h-80 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{
          animationDelay: '1s'
        }}></div>
        </div>

        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            {/* Timer */}
            <div className="mb-6 sm:mb-8">
              <p className="text-white/90 mb-4 text-base sm:text-lg">⏰ Oferta especial expira em:</p>
              <div className="flex justify-center gap-2 sm:gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 min-w-[60px] sm:min-w-[80px]">
                  <div className="text-xl sm:text-2xl font-bold text-white">{timeLeft.hours.toString().padStart(2, '0')}</div>
                  <div className="text-white/70 text-xs sm:text-sm">Horas</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 min-w-[60px] sm:min-w-[80px]">
                  <div className="text-xl sm:text-2xl font-bold text-white">{timeLeft.minutes.toString().padStart(2, '0')}</div>
                  <div className="text-white/70 text-xs sm:text-sm">Min</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 sm:p-4 min-w-[60px] sm:min-w-[80px]">
                  <div className="text-xl sm:text-2xl font-bold text-white">{timeLeft.seconds.toString().padStart(2, '0')}</div>
                  <div className="text-white/70 text-xs sm:text-sm">Seg</div>
                </div>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
              Sua Transformação Digital Começa Agora
            </h2>
            <p className="text-lg sm:text-xl text-white/90 mb-2">
              De <span className="line-through">R$ 497</span> por apenas <span className="font-bold text-2xl sm:text-3xl text-lumi-gold">R$ 297</span>
            </p>
            <p className="text-base sm:text-lg text-white/90 mb-6 sm:mb-8">
              ou <strong>12x de R$ 30,72</strong> sem juros
            </p>
            
            <Button size="lg" onClick={handleGetStarted} className="w-full sm:w-auto bg-gradient-to-r from-lumi-gold to-amber-500 hover:from-amber-500 hover:to-lumi-gold text-black text-lg sm:text-xl px-8 sm:px-12 py-4 sm:py-6 rounded-full shadow-2xl hover:scale-105 transition-all duration-300 mb-6 sm:mb-8 min-h-[48px] mx-4 sm:mx-0">
              Garantir Meu Acesso Agora
              <ArrowRight className="ml-2 sm:ml-3 h-5 w-5 sm:h-6 sm:w-6" />
            </Button>

            {/* Trust indicators sem garantia */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 justify-center text-white/90">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-lumi-gold flex-shrink-0" />
                <span className="text-sm">Acesso imediato</span>
              </div>
              <div className="flex items-center gap-2 justify-center text-white/90">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-lumi-gold flex-shrink-0" />
                <span className="text-sm">Suporte vitalício</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 sm:py-12 px-4 border-t border-border bg-muted/30">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <LumiLogo size="small" variant="full" showTagline className="mb-4 md:mb-0" />
            
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a>
              <a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a>
              <a href="#" className="hover:text-foreground transition-colors">Contato</a>
            </div>
          </div>
          
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-border text-center">
            <p className="text-xs sm:text-sm text-muted-foreground">
              © 2024 LUMI. Todos os direitos reservados. Transformando conhecimento em renda digital.
            </p>
          </div>
        </div>
      </footer>
    </div>;
};
export default LandingPage;