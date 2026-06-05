-- Migration: update embedding vector dimensions from 768 → 3072
-- Required because gemini-embedding-001 outputs 3072-dim vectors
-- whereas the old text-embedding-004 model output 768-dim vectors.
--
-- Run this ONCE against your database before restarting the server:
--   psql $DATABASE_URL -f prisma/migrations/20260604_update_vector_dims/migration.sql

-- Wipe existing embeddings first (incompatible dimensions can't be cast)
TRUNCATE TABLE resume_embeddings;
TRUNCATE TABLE job_description_embeddings;

-- Alter the column types
ALTER TABLE resume_embeddings
  ALTER COLUMN embedding TYPE vector(3072)
  USING embedding::text::vector(3072);

ALTER TABLE job_description_embeddings
  ALTER COLUMN embedding TYPE vector(3072)
  USING embedding::text::vector(3072);
