

## Plano: Mudar cor dos botoes para verde + verificar criativos

### 1. Mudar cor primary de azul para verde

A cor dos botoes e controlada pela variavel CSS `--primary` em `src/index.css`. Basta alterar os valores HSL nos dois temas (light e dark):

**Arquivo:** `src/index.css`

**Light mode (linha 28):**
- De: `--primary: 221.2 83.2% 53.3%` (azul)
- Para: `--primary: 142 71% 45%` (verde visivel)

**Light mode (linha 40 - ring):**
- De: `--ring: 221.2 83.2% 53.3%`
- Para: `--ring: 142 71% 45%`

**Dark mode (linha 78):**
- De: `--primary: 217.2 91.2% 59.8%` (azul)
- Para: `--primary: 142 71% 50%` (verde visivel no escuro)

**Dark mode (linha 79 - foreground):**
- Manter: `--primary-foreground: 0 0% 0%` (texto preto sobre verde funciona bem)

Isso muda automaticamente TODOS os botoes `default`, links, rings e qualquer elemento que use a cor `primary` em todo o projeto.

### 2. Verificacao da funcao de criativos

A funcao `creative-engine` foi corrigida na ultima sessao (modelo atualizado de `gemini-2.5-flash-image-preview` para `google/gemini-3-pro-image-preview`). O deploy foi confirmado. Nao ha logs recentes de erro nem de uso, indicando que ninguem tentou gerar criativos desde a correcao.

Apos implementar a mudanca de cor, recomendo testar a geracao de criativos diretamente no preview para confirmar que esta operacional.

### Resumo

| Mudanca | Arquivo | Linhas |
|---------|---------|--------|
| Primary light: azul para verde | src/index.css | 28, 40 |
| Primary dark: azul para verde | src/index.css | 78 |

Nenhuma outra mudanca necessaria — a variavel CSS propaga para todos os componentes automaticamente.

