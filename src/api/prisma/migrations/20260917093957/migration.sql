/*
  Warnings:

  - You are about to drop the column `created_at` on the `attempts` table. All the data in the column will be lost.
  - You are about to drop the column `max_score` on the `attempts` table. All the data in the column will be lost.
  - You are about to drop the column `quiz_id` on the `attempts` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `attempts` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `attempts` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `choices` table. All the data in the column will be lost.
  - You are about to drop the column `is_valid` on the `choices` table. All the data in the column will be lost.
  - You are about to drop the column `question_id` on the `choices` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `choices` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `levels` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `levels` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `level_id` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `quiz_id` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `questions` table. All the data in the column will be lost.
  - You are about to drop the column `wiki_link` on the `questions` table. All the data in the column will be lost.
  - The primary key for the `quiz_has_tag` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `quiz_id` on the `quiz_has_tag` table. All the data in the column will be lost.
  - You are about to drop the column `tag_id` on the `quiz_has_tag` table. All the data in the column will be lost.
  - You are about to drop the column `author_id` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `quizzes` table. All the data in the column will be lost.
  - You are about to drop the column `expires_at` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `issued_at` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `refresh_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `author_id` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the column `parent_tag_id` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `tags` table. All the data in the column will be lost.
  - You are about to drop the column `created_at` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `refresh_tokens` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `maxScore` to the `attempts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quizId` to the `attempts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `attempts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isValid` to the `choices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `questionId` to the `choices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quizId` to the `questions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `quizId` to the `quiz_has_tag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tagId` to the `quiz_has_tag` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorId` to the `quizzes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `refresh_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `authorId` to the `tags` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "attempts" DROP CONSTRAINT "attempts_user_id_fkey";

-- DropForeignKey
ALTER TABLE "choices" DROP CONSTRAINT "choices_question_id_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_level_id_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_has_tag" DROP CONSTRAINT "quiz_has_tag_quiz_id_fkey";

-- DropForeignKey
ALTER TABLE "quiz_has_tag" DROP CONSTRAINT "quiz_has_tag_tag_id_fkey";

-- DropForeignKey
ALTER TABLE "quizzes" DROP CONSTRAINT "quizzes_author_id_fkey";

-- DropForeignKey
ALTER TABLE "refresh_tokens" DROP CONSTRAINT "refresh_tokens_user_id_fkey";

-- DropForeignKey
ALTER TABLE "tags" DROP CONSTRAINT "tags_author_id_fkey";

-- DropForeignKey
ALTER TABLE "tags" DROP CONSTRAINT "tags_parent_tag_id_fkey";

-- DropIndex
DROP INDEX "refresh_tokens_user_id_key";

-- AlterTable
ALTER TABLE "attempts" DROP COLUMN "created_at",
DROP COLUMN "max_score",
DROP COLUMN "quiz_id",
DROP COLUMN "updated_at",
DROP COLUMN "user_id",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "maxScore" INTEGER NOT NULL,
ADD COLUMN     "quizId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "choices" DROP COLUMN "created_at",
DROP COLUMN "is_valid",
DROP COLUMN "question_id",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "isValid" BOOLEAN NOT NULL,
ADD COLUMN     "questionId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "levels" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "questions" DROP COLUMN "created_at",
DROP COLUMN "level_id",
DROP COLUMN "quiz_id",
DROP COLUMN "updated_at",
DROP COLUMN "wiki_link",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "levelId" INTEGER,
ADD COLUMN     "quizId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "wikiLink" TEXT;

-- AlterTable
ALTER TABLE "quiz_has_tag" DROP CONSTRAINT "quiz_has_tag_pkey",
DROP COLUMN "quiz_id",
DROP COLUMN "tag_id",
ADD COLUMN     "quizId" INTEGER NOT NULL,
ADD COLUMN     "tagId" INTEGER NOT NULL,
ADD CONSTRAINT "quiz_has_tag_pkey" PRIMARY KEY ("quizId", "tagId");

-- AlterTable
ALTER TABLE "quizzes" DROP COLUMN "author_id",
DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "authorId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "refresh_tokens" DROP COLUMN "expires_at",
DROP COLUMN "issued_at",
DROP COLUMN "user_id",
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "userId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "tags" DROP COLUMN "author_id",
DROP COLUMN "created_at",
DROP COLUMN "parent_tag_id",
DROP COLUMN "updated_at",
ADD COLUMN     "authorId" INTEGER NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "parentTagId" INTEGER,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "created_at",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_userId_key" ON "refresh_tokens"("userId") WHERE ("consumed" = false);

-- AddForeignKey
ALTER TABLE "quizzes" ADD CONSTRAINT "quizzes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "levels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "choices" ADD CONSTRAINT "choices_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tags" ADD CONSTRAINT "tags_parentTagId_fkey" FOREIGN KEY ("parentTagId") REFERENCES "tags"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_has_tag" ADD CONSTRAINT "quiz_has_tag_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_has_tag" ADD CONSTRAINT "quiz_has_tag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attempts" ADD CONSTRAINT "attempts_quizId_fkey" FOREIGN KEY ("quizId") REFERENCES "quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
