export interface CarouselTextConfig {
  headline: string;
  secondary?: string;
  cta?: string;
  textPosition?: 'top' | 'center' | 'bottom';
  textColor?: string;
  shadowIntensity?: number;
}

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
      const { textPosition = 'center', textColor = '#FFFFFF', shadowIntensity = 0.6 } = config;
      
      // Font sizes optimized for square carousel format (1:1)
      const headlineSize = img.width * 0.07; // Slightly larger for carousel
      const secondarySize = headlineSize * 0.6;
      const ctaSize = headlineSize * 0.55;

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
        ctx.font = `bold ${headlineSize}px Inter, system-ui, -apple-system, sans-serif`;
        const lines = wrapText(ctx, config.headline, img.width * 0.88);
        
        // Adjust starting Y for multiple lines
        const totalHeight = lines.length * headlineSize * 1.2;
        let startY = currentY - (totalHeight / 2);
        
        lines.forEach((line, index) => {
          ctx.fillText(line, centerX, startY + (index * headlineSize * 1.2));
        });
        currentY = startY + totalHeight + 30;
      }

      // Draw secondary text
      if (config.secondary) {
        ctx.font = `${secondarySize}px Inter, system-ui, -apple-system, sans-serif`;
        ctx.shadowBlur = 10;
        const lines = wrapText(ctx, config.secondary, img.width * 0.85);
        lines.forEach((line, index) => {
          ctx.fillText(line, centerX, currentY + (index * secondarySize * 1.3));
        });
        currentY += lines.length * secondarySize * 1.3 + 30;
      }

      // Draw CTA with button style
      if (config.cta) {
        ctx.font = `bold ${ctaSize}px Inter, system-ui, -apple-system, sans-serif`;
        
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
