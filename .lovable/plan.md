

## Plano: Corrigir duração dinâmica no webhook Kiwify

### Situação atual

O webhook está hardcoded para criar assinaturas de **3 meses** (linha 490). Analisando os dados reais do banco:

| offer_id | offer_name | valor (R$) | Deveria ser |
|----------|-----------|------------|-------------|
| `5f66f057-d013-459f-aaaa-2100a8621e94` | BLACK FRIDAY - VA - Z10 - LUMI | ~598-743 | **12 meses** (Black Friday anual) |
| `908eb5a8-91a0-49a0-ad86-582c06667ade` | BLACK FRIDAY - VA + Z10 + IA | ~598-743 | **12 meses** (Black Friday anual) |
| _(vazio)_ | Lumi | 15900 (R$159) | **1 mês** |
| _(vazio)_ | Lumi | 99700 (R$997) | **12 meses** |
| _(vazio)_ | Lumi | 123735 (R$1237) | **12 meses** |
| _(vazio)_ | Lumi | 73167 (R$731) | **12 meses** |

**Problema:** Os offer_ids da Kiwify só aparecem nas ofertas Black Friday. As ofertas regulares do produto "Lumi" chegam **sem offer_id**. Portanto, não é possível mapear apenas por offer_id — precisamos usar uma combinação de offer_id + valor do pedido.

### O que será feito

**Arquivo:** `supabase/functions/kiwify-webhook/index.ts`

1. **Criar função `determineDuration`** que calcula a duração com base em:
   - Se tem `product_offer_id` conhecido → mapear para duração específica (ex: Black Friday = 12 meses)
   - Se não tem offer_id, usar o **valor do pedido** como referência:
     - Valor <= R$200 (20000 centavos) → **1 mês**
     - Valor entre R$200-R$500 → **3 meses**
     - Valor entre R$500-R$800 → **6 meses**
     - Valor > R$800 → **12 meses**
   - Fallback: 3 meses (valor mais seguro)

2. **Substituir o hardcoded** nas linhas 484-509:
   - Trocar `endDate.setMonth(endDate.getMonth() + 3)` por usar a duração calculada
   - Trocar `duration_months: 3` pelo valor dinâmico
   - Logar o offer_id e a duração determinada para auditoria

3. **Adicionar log detalhado** com offer_id, valor e duração calculada para cada transação processada

### Preciso da sua confirmação

Os ranges de valor que identifiquei nos dados são:
- **R$159** → 1 mês
- **~R$598-743** → parece ser anual (Black Friday)
- **R$731-1237** → anual

Preciso que confirme: **quais são os valores exatos de cada plano?** (mensal, trimestral, semestral, anual) para eu configurar os ranges corretamente. Ou posso usar os valores do `PRICING_REPORT.md` que já existe no projeto?

