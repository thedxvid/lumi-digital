import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useActivity } from '@/hooks/useActivity';
import { toast } from 'sonner';
import { composeTextOnCarouselImage } from '@/utils/carouselTextComposer';

export interface CarouselImage {
  url: string;
  description: string;
  copy?: {
    headline: string;
    secondary: string;
    cta: string;
  };
  composedUrl?: string;
  baseUrl?: string;
}

export interface CarouselHistoryItem {
  id: string;
  user_id: string;
  prompt: string;
  image_count: number;
  images: CarouselImage[];
  created_at: string;
  title?: string;
  theme?: string;
  color_palette?: string;
  tone?: string;
  call_to_action?: string;
  slides_config?: any;
  generation_mode?: 'config' | 'prompt-only';
  uploaded_images?: string[];
}

export function useCarousel() {
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<CarouselHistoryItem[]>([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [totalSlides, setTotalSlides] = useState(0);
  const { logActivity } = useActivity();

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const generateCarousel = async (config: {
    title: string;
    imageCount: number;
    theme: string;
    colorPalette: string;
    tone: string;
    callToAction?: string;
    slides: any[];
    generationMode?: 'config' | 'prompt-only';
    customPrompt?: string;
    uploadedImages?: string[];
  }): Promise<CarouselHistoryItem | null> => {
    console.log('🚀 generateCarousel started', config);
    setLoading(true);
    setCurrentSlide(0);
    setTotalSlides(config.imageCount);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔐 Session check:', session ? 'authenticated' : 'not authenticated');
      
      if (!session) {
        toast.error('Você precisa estar autenticado');
        return null;
      }

      if (!config.title.trim()) {
        toast.error('Por favor, dê um título ao carrossel');
        return null;
      }

      if (config.imageCount < 2 || config.imageCount > 10) {
        toast.error('O carrossel deve ter entre 2 e 10 imagens');
        return null;
      }

      // Check limits before generating
      console.log('🔍 Checking limits...');
      const { data: limitsCheck, error: limitsError } = await supabase.functions.invoke('check-limits', {
        body: { feature: 'carousels', increment: false }
      });

      if (limitsError) {
        console.error('❌ Limits check error:', limitsError);
        toast.error('Erro ao verificar limites');
        return null;
      }

      if (!limitsCheck?.allowed) {
        toast.error(limitsCheck?.reason || 'Limite de carrosséis atingido');
        return null;
      }

      toast.info(`Gerando ${config.imageCount} slides para seu carrossel...`, {
        duration: 5000,
      });
      console.log('📡 Calling edge function...');

      const { data, error } = await supabase.functions.invoke('generate-carousel', {
        body: config
      });

      console.log('📥 Edge function response:', { data, error });

      if (error) throw error;

      if (!data?.success) {
        console.error('❌ Generation failed:', data?.error);
        throw new Error(data?.error || 'Erro ao gerar carrossel');
      }

      console.log('✅ Carousel generated successfully');
      
      // Increment usage after successful generation
      await supabase.functions.invoke('check-limits', {
        body: { feature: 'carousels', increment: true }
      });

      // Log activity
      await logActivity('result');

      toast.success('Carrossel gerado com sucesso! 🎨');
      await loadHistory();
      
      return data.carousel;
    } catch (error: any) {
      console.error('❌ Error generating carousel:', error);
      
      if (error.message?.includes('429')) {
        toast.error('Limite de requisições atingido. Tente novamente em alguns instantes.');
      } else if (error.message?.includes('402')) {
        toast.error('Créditos insuficientes. Por favor, adicione créditos.');
      } else {
        toast.error('Erro ao gerar carrossel: ' + (error.message || 'Erro desconhecido'));
      }
      
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('carousel_history' as any)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHistory((data as any) || []);
    } catch (error: any) {
      console.error('Error loading carousel history:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const deleteCarousel = async (id: string) => {
    try {
      const { error } = await supabase
        .from('carousel_history' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('Carrossel excluído');
    } catch (error: any) {
      console.error('Error deleting carousel:', error);
      toast.error('Erro ao excluir carrossel');
    }
  };

  return {
    generateCarousel,
    loadHistory,
    deleteCarousel,
    loading,
    history,
    currentSlide,
    totalSlides,
  };
}
