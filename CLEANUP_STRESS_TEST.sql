-- CLEANUP_STRESS_TEST.sql
-- Script para remover os dados gerados durante o teste de estresse
-- ATENÇÃO: Este script remove TODOS os gastos e receitas registrados HOJE.
-- Se você possui dados reais criados hoje, ajuste o filtro de data.

DELETE FROM expenses WHERE created_at >= CURRENT_DATE;
DELETE FROM incomes WHERE created_at >= CURRENT_DATE;

-- Se o seu usuário for o único no sistema, você pode simplesmente usar:
-- DELETE FROM expenses;
-- DELETE FROM incomes;
