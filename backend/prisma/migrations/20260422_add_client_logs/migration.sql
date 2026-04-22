-- CreateTable
CREATE TABLE "client_logs" (
    "id" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "context" TEXT,
    "session_id" TEXT NOT NULL,
    "user_agent" TEXT,
    "url" TEXT,
    "stack" TEXT,
    "data" JSONB,
    "timestamp" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "client_logs_level_idx" ON "client_logs"("level");

-- CreateIndex
CREATE INDEX "client_logs_session_id_idx" ON "client_logs"("session_id");

-- CreateIndex
CREATE INDEX "client_logs_context_idx" ON "client_logs"("context");

-- CreateIndex
CREATE INDEX "client_logs_timestamp_idx" ON "client_logs"("timestamp");

-- CreateIndex
CREATE INDEX "client_logs_created_at_idx" ON "client_logs"("created_at");

-- Made with Bob
