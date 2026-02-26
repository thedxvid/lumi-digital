
## Plano de Correção: Videos e Imagens

### Problema 1: Videos dando timeout (504)

**Causa raiz:** O endpoint `fal.run` (sincrono) espera a resposta completa. Kling v2.6 leva ~170s, mas o timeout do gateway e 150s.

**Solucao:** Trocar para o endpoint `queue.fal.run` com polling interno. O video e enfileirado, e a edge function verifica o status a cada 2-3 segundos ate completar.

**Arquivo:** `supabase/functions/generate-video/index.ts`

**Mudancas:**
- Linha 381: Trocar `selectedAPI.endpoint` (que usa `fal.run`) para a versao `queue.fal.run` automaticamente
- Adicionar logica de polling: apos o POST inicial, fazer GET no `response_url` ate o status ser `COMPLETED`
- Timeout maximo de 250 segundos para cobrir videos longos

### Problema 2: Imagens nao geram (modelo descontinuado)

**Causa raiz:** O modelo `gemini-2.5-flash-image-preview` usado no tier standard da creative-engine foi descontinuado. O modelo correto agora e `google/gemini-3-pro-image-preview`.

**Arquivo:** `supabase/functions/creative-engine/index.ts`

**Mudancas:**
- Linha 509: Trocar `gemini-2.5-flash-image-preview` por `google/gemini-3-pro-image-preview`
- Linha 534: Atualizar referencia no body da request

**Arquivo:** `supabase/functions/lumi-image-generation/index.ts`

**Mudancas:**
- Linha 65: Trocar `google/gemini-2.5-flash-image-preview` por `google/gemini-3-pro-image-preview`

### Resumo tecnico

| Problema | Causa | Solucao | Arquivo |
|----------|-------|---------|---------|
| Videos 504 | Timeout sincrono 150s < tempo geracao 170s | Usar queue.fal.run + polling | generate-video/index.ts |
| Imagens nao geram | Modelo AI descontinuado | Atualizar para gemini-3-pro-image-preview | creative-engine/index.ts, lumi-image-generation/index.ts |

### Ordem de implementacao

1. Atualizar modelo de imagem na creative-engine (correcao rapida)
2. Atualizar modelo na lumi-image-generation
3. Refatorar generate-video para usar queue com polling
4. Deploy e teste das 3 funcoes
