-- CreateEnum
CREATE TYPE "Role" AS ENUM ('member', 'author', 'admin');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'member';
