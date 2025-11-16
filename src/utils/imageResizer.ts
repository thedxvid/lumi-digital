/**
 * Resizes an image to exact dimensions while maintaining quality
 */
export const resizeImage = async (
  imageDataUrl: string,
  targetWidth: number,
  targetHeight: number
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Use high-quality image scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw image scaled to exact dimensions
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      // Convert to data URL with high quality
      resolve(canvas.toDataURL('image/png', 1.0));
    };

    img.onerror = () => {
      reject(new Error('Failed to load image for resizing'));
    };

    img.src = imageDataUrl;
  });
};

/**
 * Get dimensions for a format
 */
export const getFormatDimensions = (format: string): { width: number; height: number } => {
  const formatDimensions: Record<string, { width: number; height: number }> = {
    // Social Post
    'square': { width: 1080, height: 1080 },
    'vertical': { width: 1080, height: 1350 },
    'horizontal': { width: 1200, height: 675 },
    // Story
    'story-vertical': { width: 1080, height: 1920 },
    // Ad
    'ad-square': { width: 1200, height: 1200 },
    'ad-horizontal': { width: 1200, height: 628 },
    'ad-vertical': { width: 1080, height: 1350 },
    // Banner
    'banner-wide': { width: 1920, height: 1080 },
    'banner-ultra': { width: 2560, height: 1080 },
    'banner-custom': { width: 1920, height: 1080 },
    // Email
    'email-standard': { width: 600, height: 800 },
    // Product
    'product-square': { width: 1000, height: 1000 },
    'product-vertical': { width: 1000, height: 1333 },
    // Infographic
    'infographic-vertical': { width: 800, height: 2000 },
    'infographic-horizontal': { width: 2000, height: 800 },
    // Free
    'free-square': { width: 1080, height: 1080 },
    'free-custom': { width: 1080, height: 1080 }
  };

  return formatDimensions[format] || { width: 1080, height: 1080 };
};
