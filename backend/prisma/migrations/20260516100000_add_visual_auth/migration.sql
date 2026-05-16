-- AlterTable: add visual_password_recipe_id to users
ALTER TABLE "users" ADD COLUMN "visual_password_recipe_id" TEXT;

-- CreateTable: device_tokens for 14-day local network persistence
CREATE TABLE "device_tokens" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "device_tokens_token_hash_key" ON "device_tokens"("token_hash");
CREATE INDEX "device_tokens_user_id_idx" ON "device_tokens"("user_id");
CREATE INDEX "device_tokens_token_hash_idx" ON "device_tokens"("token_hash");
