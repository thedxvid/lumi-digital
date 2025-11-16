export interface TextOverlayConfig {
  headline: string;
  secondary?: string;
  cta?: string;
  textPosition?: 'top' | 'center' | 'bottom';
  textColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  shadowIntensity?: number;
}

export const composeTextOnImage = async (
  baseImageUrl: string,
  config: TextOverlayConfig
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
      const { textPosition = 'center', textColor = '#FFFFFF', fontSize = 'medium', shadowIntensity = 0.5 } = config;
      
      // Font sizes based on image width
      const fontSizes = {
        small: img.width * 0.04,
        medium: img.width * 0.06,
        large: img.width * 0.08
      };
      
      const headlineSize = fontSizes[fontSize];
      const secondarySize = headlineSize * 0.6;
      const ctaSize = headlineSize * 0.5;

      // Position calculation
      let yPosition: number;
      switch (textPosition) {
        case 'top':
          yPosition = img.height * 0.2;
          break;
        case 'bottom':
          yPosition = img.height * 0.8;
          break;
        default: // center
          yPosition = img.height * 0.5;
      }

      // Text styling
      ctx.textAlign = 'center';
      ctx.fillStyle = textColor;
      ctx.shadowColor = 'rgba(0, 0, 0, ' + shadowIntensity + ')';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      const centerX = img.width / 2;
      let currentY = yPosition;

      // Draw headline
      if (config.headline) {
        ctx.font = `bold ${headlineSize}px Inter, system-ui, sans-serif`;
        const lines = wrapText(ctx, config.headline, img.width * 0.9);
        lines.forEach((line, index) => {
          ctx.fillText(line, centerX, currentY + (index * headlineSize * 1.2));
        });
        currentY += lines.length * headlineSize * 1.2 + 20;
      }

      // Draw secondary text
      if (config.secondary) {
        ctx.font = `${secondarySize}px Inter, system-ui, sans-serif`;
        const lines = wrapText(ctx, config.secondary, img.width * 0.85);
        lines.forEach((line, index) => {
          ctx.fillText(line, centerX, currentY + (index * secondarySize * 1.3));
        });
        currentY += lines.length * secondarySize * 1.3 + 20;
      }

      // Draw CTA
      if (config.cta) {
        ctx.font = `bold ${ctaSize}px Inter, system-ui, sans-serif`;
        
        // CTA button background
        const padding = 20;
        const textMetrics = ctx.measureText(config.cta);
        const buttonWidth = textMetrics.width + padding * 2;
        const buttonHeight = ctaSize + padding;
        
        ctx.shadowBlur = 15;
        ctx.fillStyle = textColor;
        ctx.globalAlpha = 0.2;
        ctx.fillRect(
          centerX - buttonWidth / 2,
          currentY - buttonHeight / 2,
          buttonWidth,
          buttonHeight
        );
        
        // CTA text
        ctx.globalAlpha = 1;
        ctx.fillStyle = textColor;
        ctx.fillText(config.cta, centerX, currentY + ctaSize / 3);
      }

      // Convert canvas to data URL
      resolve(canvas.toDataURL('image/png'));
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
