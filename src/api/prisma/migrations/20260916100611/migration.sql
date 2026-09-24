/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `tags` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "tags" ALTER COLUMN "color" DROP NOT NULL,
ALTER COLUMN "color" SET DEFAULT '#ffffff';

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");
