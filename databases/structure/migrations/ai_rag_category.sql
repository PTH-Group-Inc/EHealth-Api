-- Migration: Thêm cột phân loại tài liệu RAG
-- Categories: GENERAL, PRICING, SCHEDULE, POLICY, MEDICAL_INFO, FAQ

ALTER TABLE ai_documents 
  ADD COLUMN IF NOT EXISTS document_category VARCHAR(50) DEFAULT 'GENERAL';
