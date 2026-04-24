-- Migration to enforce idempotency on payment_transactions
-- Creates a partial unique index on gateway_transaction_id to prevent duplicate webhook processing
-- Only applies to non-null gateway transaction IDs

CREATE UNIQUE INDEX IF NOT EXISTS idx_payment_transactions_gateway_tx_id_unique
ON payment_transactions(gateway_transaction_id)
WHERE gateway_transaction_id IS NOT NULL;
