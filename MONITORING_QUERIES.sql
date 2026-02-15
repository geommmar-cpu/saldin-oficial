# 🧪 COMANDOS DE TESTE E MONITORAMENTO

## 📊 Ver últimas mensagens processadas
SELECT 
    message_type,
    processed,
    processing_result->>'tipo' as tipo,
    processing_result->>'valor' as valor,
    processing_result->>'descricao' as descricao,
    processing_result->>'categoria_sugerida' as categoria,
    error_message,
    created_at
FROM whatsapp_logs
ORDER BY created_at DESC
LIMIT 10;

## 💰 Ver últimas transações registradas
SELECT 
    type,
    amount,
    description,
    source,
    created_at
FROM expenses
WHERE source = 'whatsapp'
ORDER BY created_at DESC
LIMIT 10;

UNION ALL

SELECT 
    type,
    amount,
    description,
    source,
    created_at
FROM incomes
WHERE source = 'whatsapp'
ORDER BY created_at DESC
LIMIT 10;

## 🏦 Ver saldo da conta
SELECT 
    ba.name as conta,
    ba.balance as saldo,
    ba.updated_at as ultima_atualizacao
FROM bank_accounts ba
ORDER BY ba.updated_at DESC;

## 📱 Ver números verificados
SELECT 
    phone_number,
    is_verified,
    created_at
FROM whatsapp_users
ORDER BY created_at DESC;
