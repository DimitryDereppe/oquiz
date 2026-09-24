import { Request, Response } from "express";
import { NotFoundError } from "../lib/errors.ts";
import * as logService from '../services/log.service.ts';
import * as logValidator from '../validators/log.validator.ts';


// == Structure générale d'une fonction controleur ==
// 1. valider la requête (req.body OU req.params OU req.query) et récupérer les données
// 2. appeler le service et transmette les données validées
// 3. envoyer la réponse
export async function maFonction(req: Request, res: Response) { 
  // 1.
  // const reqData ==> req.body (JSON) OU req.params (:id) OU req.query (URL?var_1=...&var_2=...)
  // const data = await Schema.parseAsync(reqData)

  // 2.
  // const result = service(data)

  // 3.
  // res.status(200).json(result)
}



export async function createLog(req: Request, res: Response) {

  // 1. récupérer le body de la requête et le valider (avec zod)
  const log: logValidator.Log = await logValidator.LogSchema.parseAsync(req.body);

  // 2. appeler le log service et sa fonction createLog 
  const result = await logService.createLog(log);

  // 3. retourner le résultat
  res.status(200).json(result);
}



export async function getLogs(req: Request, res: Response) {

  // 1. récupérer et valider les queries de la requete 
  const queries: logValidator.QueryFilter = await logValidator.QuerySchema.parseAsync(req.query);

  // 2. appeler le service pour chercher les logs
  const result = await logService.getLogs(queries);

  // 3. envoyer le résultat
  res.status(200).json(result);
}


export async function getLogById(req: Request, res: Response) {

  // 1. récupérer et valider l'id dans les params de la requete
  const params = await logValidator.IdSchema.parseAsync(req.params);

  // 2. chercher le log 
  // result contient un LogDocument OU null
  const result = await logService.getLogById(params.id);

  // 3. renvoyer la réponse ou 404 si rien trouvé
  if (!result) {
    throw new NotFoundError("Document non trouvé");
  }

  res.status(200).json(result);
}


export async function createLogs(req: Request, res: Response) {

  // 1. récupérer les logs dans le body de la requete
  const batch: logValidator.Batch = await logValidator.BatchSchema.parseAsync(req.body);

  // 2. demander au service d'enregistrer les logs dans la BDD
  await logService.createBatch(batch);

  // 3. renvoyer la réponse
  res.status(200).json({ message: "success" });
}


export async function getStats(req: Request, res: Response) {

  // 1. récupérer et valider les input (req.query)
  const queries = await logValidator.StatsSchema.parseAsync(req.query);

  // 2. appeler le service avec en argument les queries
  const result = await logService.getStats(queries);

  // 3. renvoyer le résultat
  res.status(200).json(result);
}