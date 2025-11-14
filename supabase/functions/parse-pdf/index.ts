import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Nenhum arquivo fornecido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    // Simple text extraction from PDF
    // Note: This is a basic implementation. For production, consider using a proper PDF parsing library
    const text = new TextDecoder('utf-8').decode(uint8Array);
    
    // Extract readable text (very basic approach)
    // In production, you'd want to use a proper PDF parsing library
    let content = '';
    const matches = text.match(/[\x20-\x7E\s]+/g);
    if (matches) {
      content = matches
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 50000); // Limit to 50k characters
    }

    if (!content || content.length < 50) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível extrair texto do PDF. Por favor, tente um PDF diferente.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        content,
        filename: file.name,
        size: file.size,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    return new Response(
      JSON.stringify({ error: 'Erro ao processar PDF' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});