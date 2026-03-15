-- AlterTable
ALTER TABLE "recipes" ADD COLUMN     "source_url" TEXT;

-- CreateIndex
CREATE INDEX "recipes_source_url_idx" ON "recipes"("source_url");
