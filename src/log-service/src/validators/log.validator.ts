import { ObjectId } from "mongodb";
import { z } from "zod";

export const IdSchema = z.strictObject({
  // refine prend en arguement une fonction à appeler pour valider l'id
  // ici ObjectId.isValid est fourne par mongo pour vérifier le fomat d'un id
  id: z.string().min(1, "id doit être renseigné").refine(ObjectId.isValid, "id est invalide"),
})


// énumération de tous les niveaux possibles
export const Levels: z.ZodEnum = z.enum([
  "silly",
  "debug",
  "verbose",
  "http",
  "info",
  "warn",
  "error"
])
// un nouveau type appelé LogLvel déduit à partir du type de la const levels
// équivalent d'interface déduit "automatiquement" à partir d'une const
export type LogLevel = z.infer<typeof Levels>;


// object() --> supprime les autres propriétés non définies 
// looseObject --> accepte des proprités supplémentaires 
// strictObject() --> lance une erreur si propriétés supplémentaire est détectée 
export const LogSchema = z.looseObject({
  // propriétés obligatoires
  level: Levels,
  message: z.string().min(1, "message requis").max(10000, "message trop long"),
  service: z.string().min(1, "service requis").max(100, "service trop long"),
  // propriétés optionnelles avec valeurs par défaut
  environment: z.string().max(50).default("development"),
  timestamp: z.coerce.date().default(() => { return new Date() }), // recalcule la nouvelle date à chaque validate d'un input
  // propriétés optionnelles
  version: z.string().max(50).optional(),
  userId: z.string().max(100).optional(),
  requestId: z.string().max(100).optional(),
  sessionId: z.string().max(10).optional(),
  hostname: z.string().max(255).optional(),
  ip: z.string().optional(),
  userAgent: z.string().max(255).optional(),
  stackTrace: z.string().max(50000).optional(),
});
export type Log = z.infer<typeof LogSchema>; // export interface



export const BatchSchema = z.object({
  logs: z.array(LogSchema).min(1, "Log recquis").max(1000, "Trop de logs pour un batch")
})
export type Batch = z.infer<typeof BatchSchema>;




export const QuerySchema = z.object({
  service: z.string().optional(),
  level: z.string().optional(),
  environment: z.string().optional(),
  userId: z.string().optional(),
  requestId: z.string().optional(),
  sessionId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(1000).default(100), // FIXME mettre une valeur par défault ?
  offset: z.coerce.number().int().min(0).max(1000).default(0), // FIXME mettre une valeur par défault ?
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  // prend en argument une fonction anomynme qui retourne un bool pour indiquer si les valeur sont valides ou pas
  ({ startDate, endDate }) => {
    if (undefined == startDate || undefined == endDate) {
      // si startData et endDate ne sont pas défini --> return
      return true;
    }

    // est-ce que startDate est bien inférieur à endDate
    // return !startDate || !endDate || startDate <= endDate;
    return startDate <= endDate;
  });
export type QueryFilter = z.infer<typeof QuerySchema>;





export const StatsSchema = z.object({
  service: z.string().optional(),
  environment: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
}).refine(
  // prend en argument une fonction anomynme qui retourne un bool pour indiquer si les valeur sont valides ou pas
  ({ startDate, endDate }) => {
    if (undefined == startDate || undefined == endDate) {
      // si startData et endDate ne sont pas défini --> return
      return true;
    }

    // est-ce que startDate est bien inférieur à endDate
    // return !startDate || !endDate || startDate <= endDate;
    return startDate <= endDate;
  });
export type StatFilter = z.infer<typeof StatsSchema>;