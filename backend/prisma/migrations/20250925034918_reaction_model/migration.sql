/*
  Warnings:

  - Changed the type of `type` on the `reactions` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "public"."ReactionType" AS ENUM ('LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY');

-- AlterTable
ALTER TABLE "public"."reactions" DROP COLUMN "type",
ADD COLUMN     "type" "public"."ReactionType" NOT NULL;
