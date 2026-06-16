ALTER TABLE "tb_document"
ADD COLUMN IF NOT EXISTS "last_update_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "tb_document_last_update_at_document_id_idx"
ON "tb_document" ("last_update_at" DESC, "document_id" DESC);
