import type PersistentFile from "formidable/PersistentFile.js";
import { prisma } from "../models/index.ts";
import type { File } from "../../generated/prisma/client.ts";

export async function saveFiles(filesToSave: Array<any>): Promise<Array<File>> {

  return await prisma.file.createManyAndReturn({
    data: filesToSave.map((file) => { // convertion de files en tableau d'objet utilisables par prisma 
      return {
        size: file.size ?? 0,
        path: file.filepath ?? "",
        newFileName: file.newFilename ?? "",
        originalFileName: file.originalFileame ?? "",
        mimeType: file.mimetype ?? ""
      };
    })
  });
}