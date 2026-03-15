-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('user', 'admin', 'superadmin');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "is_blocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'user';

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");
