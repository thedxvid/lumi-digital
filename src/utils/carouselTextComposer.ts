export interface CarouselTextConfig {
  headline: string;
  secondary?: string;
  cta?: string;
  textPosition?: 'top' | 'center' | 'bottom';
  textColor?: string;
  shadowIntensity?: number;
  fontFamily?: 'montserrat' | 'poppins' | 'raleway' | 'outfit' | 'jakarta' | 'inter';
  tone?: string;
}

// Mapeamento de fontes baseado no tom do conteúdo
const getFontForTone = (tone?: string): string => {
  const toneMap: Record<string, string> = {
    professional: 'Montserrat, sans-serif',
    casual: 'Poppins, sans-serif',
    friendly: 'Poppins, sans-serif',
    elegant: 'Raleway, serif',
    modern: 'Outfit, sans-serif',
    minimalist: 'Plus Jakarta Sans, sans-serif',
    creative: 'Outfit, sans-serif',
    inspirational: 'Raleway, serif',
    luxury: 'Raleway, serif'
  };
  
  return toneMap[tone || 'professional'] || 'Montserrat, sans-serif';
};

export const composeTextOnCarouselImage = async (
  baseImageUrl: string,
  config: CarouselTextConfig
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw base image
      ctx.drawImage(img, 0, 0);

      // Configure text styling
      const { 
        textPosition = 'center', 
        textColor = '#FFFFFF', 
        shadowIntensity = 0.6,
        fontFamily,
        tone 
      } = config;
      
      // Seleciona fonte baseada no tom ou usa fonte especificada
      const selectedFont = fontFamily 
        ? `${fontFamily.charAt(0).toUpperCase() + fontFamily.slice(1)}, sans-serif`
        : getFontForTone(tone);
      
      // Font sizes optimized for square carousel format (1:1)
      const headlineSize = img.width * 0.075; // Um pouco maior para fontes modernas
      const secondarySize = headlineSize * 0.58;
      const ctaSize = headlineSize * 0.52;

      // Position calculation
      let yPosition: number;
      switch (textPosition) {
        case 'top':
          yPosition = img.height * 0.25;
          break;
        case 'bottom':
          yPosition = img.height * 0.75;
          break;
        default: // center
          yPosition = img.height * 0.5;
      }

      // Text styling
      ctx.textAlign = 'center';
      ctx.fillStyle = textColor;
      ctx.shadowColor = 'rgba(0, 0, 0, ' + shadowIntensity + ')';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const centerX = img.width / 2;
      let currentY = yPosition;

      // Draw headline
      if (config.headline) {
        ctx.font = `800 ${headlineSize}px ${selectedFont}`;
        const lines = wrapText(ctx, config.headline, img.width * 0.88);
        
        // Adjust starting Y for multiple lines
        const totalHeight = lines.length * headlineSize * 1.25;
        let startY = currentY - (totalHeight / 2);
        
        lines.forEach((line, index) => {
          ctx.fillText(line, centerX, startY + (index * headlineSize * 1.25));
        });
        currentY = startY + totalHeight + 35;
      }

      // Draw secondary text
      if (config.secondary) {
        ctx.font = `500 ${secondarySize}px ${selectedFont}`;
        ctx.shadowBlur = 10;
        const lines = wrapText(ctx, config.secondary, img.width * 0.86);
        lines.forEach((line, index) => {
          ctx.fillText(line, centerX, currentY + (index * secondarySize * 1.35));
        });
        currentY += lines.length * secondarySize * 1.35 + 32;
      }

      // Draw CTA with button style
      if (config.cta) {
        ctx.font = `700 ${ctaSize}px ${selectedFont}`;
        
        // CTA button background
        const padding = 24;
        const textMetrics = ctx.measureText(config.cta);
        const buttonWidth = textMetrics.width + padding * 2;
        const buttonHeight = ctaSize + padding * 1.2;
        
        // Button background with rounded corners effect
        ctx.shadowBlur = 18;
        ctx.fillStyle = textColor;
        ctx.globalAlpha = 0.25;
        ctx.fillRect(
          centerX - buttonWidth / 2,
          currentY - buttonHeight / 2,
          buttonWidth,
          buttonHeight
        );
        
        // CTA text
        ctx.globalAlpha = 1;
        ctx.fillStyle = textColor;
        ctx.shadowBlur = 12;
        ctx.fillText(config.cta, centerX, currentY + ctaSize / 3);
      }

      // Convert canvas to data URL
      resolve(canvas.toDataURL('image/png', 0.95));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    img.src = baseImageUrl;
  });
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  words.forEach(word => {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  });
  
  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};
