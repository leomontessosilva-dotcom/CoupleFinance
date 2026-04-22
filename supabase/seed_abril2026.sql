-- ═══════════════════════════════════════════════════════════════
--  CoupleFinance — Seed: Abril 2026
--  Dados extraídos dos documentos: Holerite Mar/26, MP Apr/26, Nubank Apr/26
--  Rodar no Supabase SQL Editor (como postgres, bypassa RLS)
-- ═══════════════════════════════════════════════════════════════

-- ── Cartão de Crédito ─────────────────────────────────────────
insert into credit_cards (id, name, card_limit, person, color)
values ('cc_nubank_leo', 'Nubank Leo', 300.00, 'Leonardo', '#8B5CF6')
on conflict (id) do update
  set name = excluded.name,
      card_limit = excluded.card_limit,
      person = excluded.person,
      color = excluded.color;

-- ── Cofrinhos (Mercado Pago Reservas) ─────────────────────────
-- Use o botão de editar nos cards para ajustar meta e saldo atual depois de criado.
insert into savings_jars (id, name, emoji, target_value, current_value, color, monthly_contribution, description)
values
  ('jar_carro',        'Carro',        '🚗', 3000.00, 0.00, '#3b82f6', 150.00, 'Reserva para carro'),
  ('jar_debito_leo',   'Débito Leo',   '💳', 5000.00, 0.00, '#7c3aed', 500.00, 'Reserva Leonardo'),
  ('jar_apartamento',  'Apartamento',  '🏠', 20000.00, 0.00, '#10b981', 900.00, 'Reserva para apartamento'),
  ('jar_debito_serena','Débito Serena','💜', 5000.00, 0.00, '#ec4899', 740.00, 'Reserva Serena')
on conflict (id) do update
  set name = excluded.name,
      emoji = excluded.emoji,
      color = excluded.color,
      monthly_contribution = excluded.monthly_contribution,
      description = excluded.description;

-- ── Salário Março 2026 (Holerite VITA BE) ─────────────────────
insert into transactions (id, type, category, description, amount, date, person)
values (
  'tx_salario_leo_mar26',
  'income',
  'Salário',
  'Salário Março 2026 – VITA BE Cosméticos',
  4300.70,
  '2026-03-31',
  'Leonardo'
)
on conflict (id) do nothing;

-- ── Configurações ─────────────────────────────────────────────
insert into settings (key, value)
values ('salary_Leonardo', '4300.70')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ═══════════════════════════════════════════════════════════════
--  PRÓXIMO PASSO:
--  Após rodar este script, abra os cofrinhos no app e clique no
--  ícone de lápis (✏️) para ajustar:
--    • Meta de valor (target_value) de cada cofrinho
--    • Saldo atual (current_value) — saldo real que estava no extrato MP
--
--  Os aportes de Abril (transações do extrato MP) devem ser
--  importados via Perfis → Importar Extrato para que o tracking
--  mensal funcione corretamente com savingsJarId.
-- ═══════════════════════════════════════════════════════════════
