-- Convert model keys from UUID to TEXT while preserving existing values.
ALTER TABLE "tb_model_ia_key"
  ALTER COLUMN "model_key" TYPE TEXT USING "model_key"::text;

-- Add chat_model safely for existing rows before enforcing NOT NULL and UNIQUE.
ALTER TABLE "tb_model_ia"
  ADD COLUMN "chat_model" VARCHAR(100);

WITH candidates AS (
  SELECT
    "model_ia_id",
    "model_nm",
    LEFT("model_nm", 100) AS "base_chat_model",
    COUNT(*) OVER (PARTITION BY LEFT("model_nm", 100)) AS "base_count"
  FROM "tb_model_ia"
)
UPDATE "tb_model_ia" AS model
SET "chat_model" = CASE
  WHEN candidates."base_count" = 1 THEN candidates."base_chat_model"
  ELSE LEFT(candidates."model_nm", 90) || '-' || candidates."model_ia_id"::text
END
FROM candidates
WHERE model."model_ia_id" = candidates."model_ia_id";

ALTER TABLE "tb_model_ia"
  ALTER COLUMN "chat_model" SET NOT NULL;

ALTER TABLE "tb_model_ia"
  ADD CONSTRAINT "tb_model_ia_chat_model_key" UNIQUE ("chat_model");
