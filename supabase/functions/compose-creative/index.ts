import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Font rendering helper - simplified version without Canvas types
function wrapText(ctx: any, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ')
  let line = ''
  let currentY = y

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' '
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY)
      line = words[n] + ' '
      currentY += lineHeight
    } else {
      line = testLine
    }
  }
  ctx.fillText(line, x, currentY)
  return currentY + lineHeight
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { baseImage, copy, config } = await req.json()

    if (!baseImage || !copy) {
      throw new Error('Base image and copy are required')
    }

    console.log('Composing creative with copy:', copy)

    // Import canvas dynamically
    const { createCanvas, loadImage } = await import("https://deno.land/x/canvas@v1.4.1/mod.ts")

    // Load the base image
    const img = await loadImage(baseImage)
    const canvas = createCanvas(img.width(), img.height())
    const ctx = canvas.getContext('2d')

    // Draw base image
    ctx.drawImage(img, 0, 0)

    // Add semi-transparent overlay for better text readability
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.3)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.6)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Text rendering settings
    const width = canvas.width
    const height = canvas.height
    const padding = width * 0.05

    // Extract customization options from config (with defaults)
    const textPosition = config?.textPosition || 'top'
    const textColor = config?.textColor || '#FFFFFF'
    const fontSize = config?.fontSize || 'medium'
    const shadowIntensity = config?.shadowIntensity ?? 10

    // Configure text sizes based on fontSize setting
    const fontSizeMultiplier = fontSize === 'small' ? 0.8 : fontSize === 'large' ? 1.3 : 1.0
    const headlineSize = Math.floor(width * 0.08 * fontSizeMultiplier)
    const secondarySize = Math.floor(width * 0.04 * fontSizeMultiplier)
    const ctaSize = Math.floor(width * 0.045 * fontSizeMultiplier)

    // Calculate vertical position based on textPosition
    let currentY = padding * 2
    if (textPosition === 'center') {
      currentY = height / 2 - (headlineSize * 2)
    } else if (textPosition === 'bottom') {
      currentY = height - padding * 8
    }

    // Render Headline (Main Text)
    if (copy.headline) {
      ctx.font = `bold ${headlineSize}px Arial, sans-serif`
      ctx.fillStyle = textColor
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
      ctx.shadowBlur = shadowIntensity
      ctx.shadowOffsetX = 0
      ctx.shadowOffsetY = 4
      
      currentY = wrapText(
        ctx, 
        copy.headline.toUpperCase(), 
        padding, 
        currentY, 
        width - (padding * 2), 
        headlineSize * 1.2
      )
      currentY += padding * 0.5
    }

    // Render Secondary Text
    if (copy.secondary) {
      ctx.font = `${secondarySize}px Arial, sans-serif`
      ctx.fillStyle = textColor
      ctx.shadowBlur = shadowIntensity * 0.5
      
      currentY = wrapText(
        ctx, 
        copy.secondary, 
        padding, 
        currentY, 
        width - (padding * 2), 
        secondarySize * 1.3
      )
      currentY += padding
    }

    // Render CTA Button
    if (copy.cta) {
      const ctaText = copy.cta.toUpperCase()
      ctx.font = `bold ${ctaSize}px Arial, sans-serif`
      const ctaMetrics = ctx.measureText(ctaText)
      const ctaWidth = ctaMetrics.width + padding * 2
      const ctaHeight = ctaSize * 1.8
      
      // Position CTA at bottom
      const ctaX = padding
      const ctaY = height - padding - ctaHeight

      // Draw CTA background
      ctx.shadowBlur = 15
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
      ctx.fillStyle = '#FF6B35' // Orange/accent color
      ctx.fillRect(ctaX, ctaY, ctaWidth, ctaHeight)

      // Draw CTA text
      ctx.shadowBlur = 0
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText(
        ctaText, 
        ctaX + padding, 
        ctaY + (ctaHeight / 2) + (ctaSize / 3)
      )
    }

    // Convert canvas to base64
    const buffer = canvas.toBuffer()
    const base64Array = Array.from(new Uint8Array(buffer))
    const base64String = btoa(String.fromCharCode(...base64Array))
    const base64 = `data:image/png;base64,${base64String}`

    console.log('Creative composition complete')

    return new Response(
      JSON.stringify({ 
        image: base64,
        description: `Criativo com: ${copy.headline}`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in compose-creative:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
