import { Request, Response } from "express";

import { formParser } from "../lib/upload.ts";

import * as fileService from "../services/file.service.ts";
import * as fileValidator from "../validators/file.validator.ts";
import sharp from "sharp";
import { BadRequestError } from "../lib/errors.ts";
import { prisma } from "../models/index.ts";
import { existsSync } from "node:fs";

// Pour uploader une image avec le bon mimeType : 
// curl -X POST "http://localhost:5000/api/files" -F "image=@./sample.jpg;type=image/jpeg"
export async function upload(req: Request, res: Response) {

  // parser la requete avec le module formidable
  // --> lit le contenu de la requête ET enregistrer le(s) fichier(s) sur le disque dur

  // formParser analyse directementr le formulaire envoyé dans la requête et enregistre les fichiers uploadés
  // formeParser.parse retourne un tableau de deux éléments : 
  // fileds est un objett qui contient toutes les valeurs des champs classiques du formulaire
  // files est un objet qui contient les informations de chaque fichier uploadé.
  // les informations sont regroupées par input name (il est possible d'uploader plusieurs fichiers pour un input avec multiple : <input type="file" name="images" multiple> )
  // exemple, contenu de files : { input_1: [{...}, {...}], input_2: [{...}], }
  // les informations des fichiers uploadés sont stockée dans une interface PersistentFile
  const [fields, files] = await formParser.parse(req);

  // files est donc un peu contraignant à manipuler
  // on voudrait récupérer un tableau "plat" de tous les fichiers uploadé indépendamment de l'input name
  // résultat attendu [ {...}, {...}, {...} ]
  // --> un tableau de PersistentFile

  // Object.values --> crée un tableau à partir d'un objet en éliminant ses clés
  const filesToSave: Array<any> = Object.values(files)
    // flatmap rassemble un tableau de tableaux en un seul grand tableau
    // [ [...], [....], [..] ] ==> [ .......... ]
    .flatMap((group) => { // Formidable peut retourner des valeurs null à la place d'un tableau vide 
      return group ?? [] // si c'est le cas, on retourne un tableau vide
    });

  // enregistre les informations des fichiers dans la BDD
  const savedFiles = await fileService.saveFiles(filesToSave);

  res.status(200).json(savedFiles);
}

export async function getFile(req: Request, res: Response): Promise<void> {

  const { id } = await fileValidator.IdParamsSchema.parseAsync(req.params);
  
  const queryParams = await fileValidator.QueryParamsGetFileSchema.parseAsync(req.query);

  // cherche les données de l'image dans la BDD
  const file = await prisma.file.findUnique({
    where: { id },
  });

  if (!file) {
    // @TODO: gérer les erreurs de manière plus propre
    // On pourrait le remplacer par les erreurs custom fait dans la partie `api` de l'application
    // avec le handler d'erreurs global
    res.status(404).json({ error: 'File not found' });
    return;
  }

  // Vérifier si le fichier existe sur le disque
  if (!existsSync(file.path)) {
    res.status(404).json({ error: 'File not found on disk' });
    return;
  }

  // Si le fichier n'est pas une image
  // Ou si aucune transformation n'est demandée (queryParams vide)
  // On le renvoie tel quel
  if (!file.mimeType.startsWith('image/') || Object.keys(queryParams).length === 0) {
    res.sendFile(file.path);
    return;
  }


  // -------------------------------
  // ** Transformation des images ** 
  // -------------------------------


  const image = sharp(file.path);

  if (queryParams.resize) {
    image.resize(queryParams.resize.width, queryParams.resize.height);
  }

  if (queryParams.quality) {
    // découpe la string file.mimeType autour de "/" et récupère la partie de droite 
    const format = file.mimeType.split('/')[1]

    // vérifie que le format attendu est bien supporté par sharp
    if (format !== "jpeg" &&
      format !== "png" &&
      format !== "webp" &&
      format !== "avif"
    ) {
      throw new BadRequestError("Format d’image non pris en charge");
    }

    // conserve le format initial de l'image et réduis sa qualité
    image.toFormat(format, { quality: queryParams.quality });
  }

  if (queryParams.rotate) {
    image.rotate(queryParams.rotate);
  }

  if (queryParams.blur) {
    image.blur(queryParams.blur);
  }

  // change le format de l'image
  if (queryParams.format) {
    image.toFormat(queryParams.format);
  }

  if (queryParams.negate) {
    image.negate();
  }

  if (queryParams.tint) {
    image.tint(queryParams.tint);
  }

  if (queryParams.crop) {
    image.extract(queryParams.crop);
  }

  const buffer = await image.toBuffer();

  res.setHeader('Content-Type', queryParams.format ? `image/${queryParams.format}` : file.mimeType);
  res.setHeader('Content-Length', buffer.length.toString());

  res.send(buffer);
}