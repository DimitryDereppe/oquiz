import formidable from "formidable";
import path from "node:path";
import crypto from "node:crypto";

// calculer le chemin absolut de ./uploads --> ./uploads est créé à partir du dossier  où est exécuté npm run dev
export const uploadDir = path.resolve("./uploads");

export const formParser = formidable({
  uploadDir,
  createDirsFromUploads: true, // créer les dossier s'ils n'existent pas
  keepExtensions: true, // conserve les extention des noms de fichier
  // configurer la hiérarchie du dossier upload
  // configure le chemin et le nom du fichier uploadé
  filename(name, ext, part, form) {
    const currentDate = new Date();
    // une chaîne de caractères aléatoire comme nom de fichier
    const newName = crypto.randomBytes(16).toString('hex');
    // année / mois / jour / <random><.ext>
    return `${currentDate.getFullYear()}/${currentDate.getMonth() + 1}/${currentDate.getDate()}/${newName}${ext}`;
  },
})