/*
  Warnings:

  - You are about to alter the column `color` on the `tags` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(7)`.

*/
-- AlterTable
ALTER TABLE "tags" ALTER COLUMN "color" SET DATA TYPE VARCHAR(7);
