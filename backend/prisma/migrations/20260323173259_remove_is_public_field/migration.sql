/*
  Warnings:

  - You are about to drop the column `is_public` on the `recipes` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "recipes_is_public_idx";

-- AlterTable
ALTER TABLE "recipes" DROP COLUMN "is_public";
