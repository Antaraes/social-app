/*
  Warnings:

  - You are about to drop the column `reaction_count` on the `reactions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."posts" ADD COLUMN     "reaction_count" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "public"."reactions" DROP COLUMN "reaction_count";
