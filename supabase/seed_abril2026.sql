-- ═══════════════════════════════════════════════════════════════
--  CoupleFinance — Seed: Abril 2026 (dados reais)
--
--  Origem:
--    • Holerite VITA BE COSMÉTICOS — Março 2026 (pago 07/04/2026)
--    • Extrato Nubank Conta 01–21 ABR 2026
--    • Extrato Mercado Pago 01–21 ABR 2026
--
--  Convenções desta seed:
--    • Transferências entre as contas do próprio Leo (Itaú ↔ Nubank ↔ MP)
--      NÃO entram como receita/despesa — são movimentações internas.
--    • PIX entre Leo e Serena também são ignorados (é dinheiro do casal
--      trocando de bolso, não fluxo novo).
--    • Pagamento da fatura Nubank (R$ 448,48) não é cadastrado como
--      despesa — as compras de crédito anteriores é que deveriam estar
--      registradas. Cadastre-as manualmente se precisar.
--    • "Dinheiro reservado" do MP = aportes em cofrinhos.
--    • Retiradas líquidas do cofrinho "Débito Serena" (R$ 220 + R$ 40)
--      foram compensadas: cofrinho fica com o NET de abril (R$ 740).
--
--  Rodar no Supabase → SQL Editor → New Query (como postgres, bypassa RLS).
--  Pode rodar várias vezes sem duplicar (ON CONFLICT DO UPDATE / NOTHING).
-- ═══════════════════════════════════════════════════════════════

-- ── Salary history (lido pelo store na inicialização) ─────────
insert into settings (key, value) values
  ('salary_Leonardo',         '4300.70'),
  ('salary_history_Leonardo', '{"2026-04": 4300.70}')
on conflict (key) do update set value = excluded.value, updated_at = now();

-- ── Cofrinhos (Mercado Pago – Dinheiro reservado) ─────────────
-- current_value = aportes líquidos de Abril.
-- Ajuste target_value e monthly_contribution no app conforme quiser.
insert into savings_jars
  (id, name, emoji, target_value, current_value, color, monthly_contribution, description)
values
  ('jar_carro',         'Carro',         '🚗',  5000.00,   150.00, '#3b82f6', 150.00, 'Reserva para carro'),
  ('jar_apartamento',   'Apartamento',   '🏠', 50000.00,   900.00, '#10b981', 900.00, 'Reserva apartamento'),
  ('jar_debito_leo',    'Débito Leo',    '💳',  2000.00,   500.00, '#7c3aed', 500.00, 'Reserva de uso próximo'),
  ('jar_debito_serena', 'Débito Serena', '💜',  2000.00,   740.00, '#ec4899', 740.00, 'Reserva da Serena')
on conflict (id) do update set
  name                 = excluded.name,
  emoji                = excluded.emoji,
  target_value         = excluded.target_value,
  current_value        = excluded.current_value,
  color                = excluded.color,
  monthly_contribution = excluded.monthly_contribution,
  description          = excluded.description;

-- ── Salário Abril 2026 (Leonardo) ─────────────────────────────
-- Id determinístico — a mesma id que ensureSalaryTransactions gera.
insert into transactions
  (id, type, category, description, amount, date, person)
values
  ('salary_Leonardo_2026-04', 'income', 'Salário', 'Salário Leonardo', 4300.70, '2026-04-07', 'Leonardo')
on conflict (id) do update set
  amount = excluded.amount, date = excluded.date, description = excluded.description;

-- ── Outras receitas (Leo) ─────────────────────────────────────
insert into transactions
  (id, type, category, description, amount, date, person, payment_method)
values
  ('tx_apr26_pix_mayara',   'income', 'Outros Ganhos', 'PIX recebido — Mayara Caroline',        400.00, '2026-04-04', 'Leonardo', 'pix'),
  ('tx_apr26_pix_felippe1', 'income', 'Outros Ganhos', 'PIX recebido — Felippe Campesatto',       7.00, '2026-04-07', 'Leonardo', 'pix'),
  ('tx_apr26_pix_felippe2', 'income', 'Outros Ganhos', 'PIX recebido — Felippe Campesatto',      11.01, '2026-04-08', 'Leonardo', 'pix'),
  ('tx_apr26_pix_felippe3', 'income', 'Outros Ganhos', 'PIX recebido — Felippe Campesatto',      16.00, '2026-04-15', 'Leonardo', 'pix'),
  ('tx_apr26_rend_mp',      'income', 'Investimentos', 'Rendimentos Mercado Pago (consolidado)', 11.37, '2026-04-21', 'Leonardo', null)
on conflict (id) do update set
  amount = excluded.amount, date = excluded.date;

-- ── Despesas (Leo) — MP + Nubank ──────────────────────────────
insert into transactions
  (id, type, category, description, amount, date, person, payment_method)
values
  ('tx_apr26_matheus_1',   'expense', 'Outros',      'Pagamento 60902819matheus',                  1.99, '2026-04-01', 'Leonardo', 'debito'),
  ('tx_apr26_matheus_2',   'expense', 'Outros',      'Pagamento 60902819matheus',                  7.98, '2026-04-07', 'Leonardo', 'debito'),
  ('tx_apr26_matheus_3',   'expense', 'Outros',      'Pagamento 60902819matheus',                 15.48, '2026-04-08', 'Leonardo', 'debito'),
  ('tx_apr26_vinicius',    'expense', 'Outros',      'Pagamento Vinicius',                        35.00, '2026-04-08', 'Leonardo', 'debito'),
  ('tx_apr26_smart_1',     'expense', 'Moradia',     'Smart Damha (condomínio)',                   9.23, '2026-04-09', 'Leonardo', 'debito'),
  ('tx_apr26_bus',         'expense', 'Transporte',  'BUS Serviços (ônibus)',                     80.06, '2026-04-09', 'Leonardo', 'pix'),
  ('tx_apr26_smart_2',     'expense', 'Moradia',     'Smart Damha (condomínio)',                   2.59, '2026-04-10', 'Leonardo', 'debito'),
  ('tx_apr26_shopping',    'expense', 'Outros',      'Shopping Valinhos',                          3.00, '2026-04-10', 'Leonardo', 'debito'),
  ('tx_apr26_autopass_1',  'expense', 'Transporte',  'AUTOPASS',                                  10.80, '2026-04-10', 'Leonardo', 'pix'),
  ('tx_apr26_autopass_2',  'expense', 'Transporte',  'AUTOPASS',                                  21.60, '2026-04-11', 'Leonardo', 'pix'),
  ('tx_apr26_cinemark',    'expense', 'Lazer',       'Cinemark',                                  48.00, '2026-04-11', 'Leonardo', 'debito'),
  ('tx_apr26_americanas',  'expense', 'Outros',      'Lojas Americanas',                           6.99, '2026-04-11', 'Leonardo', 'debito'),
  ('tx_apr26_bobs',        'expense', 'Alimentação', 'Bobs',                                      20.00, '2026-04-12', 'Leonardo', 'debito'),
  ('tx_apr26_danilo',      'expense', 'Outros',      'Pagamento Danilo Manso Pires',              13.07, '2026-04-14', 'Leonardo', 'pix'),
  ('tx_apr26_smart_3',     'expense', 'Moradia',     'Smart Damha (condomínio)',                 16.98, '2026-04-15', 'Leonardo', 'debito'),
  ('tx_apr26_bassani',     'expense', 'Outros',      'Pagamento José Bassani',                    37.00, '2026-04-16', 'Leonardo', 'pix'),
  ('tx_apr26_sorvete_1',   'expense', 'Alimentação', 'Sorveteria Nelimell',                       52.49, '2026-04-18', 'Leonardo', 'debito'),
  ('tx_apr26_sorvete_2',   'expense', 'Alimentação', 'Sorveteria Nelimell',                       40.00, '2026-04-19', 'Leonardo', 'debito'),
  ('tx_apr26_spotify',     'expense', 'Assinaturas', 'Spotify',                                   40.90, '2026-04-20', 'Leonardo', 'debito'),
  ('tx_apr26_so_ofertas',  'expense', 'Alimentação', 'Só Ofertas',                                12.97, '2026-04-21', 'Leonardo', 'debito')
on conflict (id) do update set
  amount = excluded.amount, date = excluded.date, description = excluded.description;

-- ── Aportes em cofrinhos (category 'Aporte', type expense) ────
insert into transactions
  (id, type, category, description, amount, date, person, savings_jar_id)
values
  ('tx_apr26_aporte_carro',    'expense', 'Aporte', 'Aporte: Carro',          150.00, '2026-04-05', 'Casal',    'jar_carro'),
  ('tx_apr26_aporte_apto_1',   'expense', 'Aporte', 'Aporte: Apartamento',    500.00, '2026-04-05', 'Casal',    'jar_apartamento'),
  ('tx_apr26_aporte_apto_2',   'expense', 'Aporte', 'Aporte: Apartamento',    100.00, '2026-04-05', 'Casal',    'jar_apartamento'),
  ('tx_apr26_aporte_apto_3',   'expense', 'Aporte', 'Aporte: Apartamento',    300.00, '2026-04-13', 'Casal',    'jar_apartamento'),
  ('tx_apr26_aporte_leo',      'expense', 'Aporte', 'Aporte: Débito Leo',     500.00, '2026-04-05', 'Leonardo', 'jar_debito_leo'),
  ('tx_apr26_aporte_serena',   'expense', 'Aporte', 'Aporte: Débito Serena', 1000.00, '2026-04-13', 'Casal',    'jar_debito_serena')
on conflict (id) do update set
  amount = excluded.amount, date = excluded.date;

-- ═══════════════════════════════════════════════════════════════
-- PRÓXIMOS PASSOS MANUAIS:
--   1. Cadastre o salário da Serena em Perfis → Editar salário
--      (o app cria a transação automática 'salary_Serena_2026-04').
--   2. Se quiser registrar a fatura Nubank de Abril (R$ 448,48),
--      crie um cartão de crédito em Dashboard e lance as compras
--      que compuseram a fatura como transações de crédito.
--   3. Confira os aportes em Cofrinhos — ajuste target_value se
--      os que coloquei (ex: Apartamento = R$ 50k) não refletem.
-- ═══════════════════════════════════════════════════════════════
