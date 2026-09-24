-- CreateTable
CREATE TABLE "files" (
    "id" SERIAL NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "newFileName" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "files_path_key" ON "files"("path");

-- CreateIndex
CREATE UNIQUE INDEX "files_newFileName_key" ON "files"("newFileName");
