
// définition d'un document à insérer dans la BDD

import { Collection, Document, Filter, InsertManyResult, MongoGCPError, ObjectId, Timestamp } from "mongodb";
import { config } from '../../config.ts';
import * as mongoDB from '../lib/mongodb.ts';
import * as logValidator from '../validators/log.validator.ts';


// définition de la structure des documents à insérer dans la BDD
// ici, pour faire simple, data qui est string
// LogDocuemnt hérite de Document (mongodb) --> donc LogDocument, c'est aussi un Document (mongo)
// LogDocument hérite également de logValidator.Log --> elle possède donc toutes les propriétés du type Log
export interface LogDocument extends Document, logValidator.Log {
  // _id?: ObjectId, // id MongoDB du document inséré dans la BDD --> inutile maintenant qu'on hérite de Document (mongodb)
  // data: string // vielle version
}


// définir le type de document stocké dans la BDD, ici des LogDocument
const client = await mongoDB.connect();
const collection: Collection<LogDocument> = client.db().collection(config.mongodbCollection);


export async function createLog(log: LogDocument): Promise<LogDocument> {

  // const client = await mongoDB.connect();
  // const result = await client.db().collection(config.mongodbCollection).insertOne(log);
  const result = await collection.insertOne(log);

  if (!result || !result.acknowledged) {
    throw new Error("Failed to save log");
  }

  // si l'insertion s'et bien passée, log._id contient l'id du document ajouté dans la BDD
  return log;
}


// argument de la fonction : id type string qui contient l'id du document à rechercher
// type de retour : 
//   1 Promise car la fonction est asynchrone (async)
//   dans la Promise --> 1 LogDocuemnt si un document est trouvé OU null si aucun document trouvé 
export async function getLogById(id: string): Promise<LogDocument | null> {

  // const client = await mongoDB.connect();

  // crée un nouveau ObjectId qui prend la valeur reçue en arguement (id)
  const searchId: ObjectId = new ObjectId(id);
  // recherche selon searchId
  const result = await collection.findOne({ _id: searchId })

  // FIXME inutile, car resul est déjà de type LogDocument OU null
  // if (!result) { 
  //   return null;
  // }

  return result;
}


export interface LogsWithPagination {
  logs: Array<LogDocument>; // une liste de LogDocument
  total: number; // le nombre total de log
}


// retourne tous les log de la BDD au format LogsWithPagination
// le tableau retourné peut être vide
export async function getLogs(filters: logValidator.QueryFilter): Promise<LogsWithPagination> {

  // traduction du QueryFilter en un filtre compréhenssible par mongoDB
  // mongoFilter : filtre mongoDB --> équivalent d'un where en SQL
  const mongoFilter: Filter<LogDocument> = {};

  // si dans filers (logValidator.QueryFilter) j'ai une propriété "service" (service est renseigné dans les queries de la requete)
  // alors, ajouter une proprité "service" dans le mongofFilter ; sa valeur est filters.service
  if (filters.service) mongoFilter.service = filters.service
  if (filters.level) mongoFilter.level = filters.level;
  if (filters.environment) mongoFilter.environment = filters.environment;
  if (filters.userId) mongoFilter.userId = filters.userId;
  if (filters.requestId) mongoFilter.requestId = filters.requestId;
  if (filters.sessionId) mongoFilter.sessionId = filters.sessionId;

  // filter par rapport aux date --> le timestamp des logs
  if (filters.startDate || filters.endDate) {
    // si j'ai une valeur pour startDate ou endDate, ajoute dans le mongoFilter, un filtre sur le timestamps
    mongoFilter.timestamp = {};
    if (filters.startDate) {
      // si j'ai une valeur pour startDate --> les timestamps doivent être suppérieur (greater --> $gte) à filters.startData
      mongoFilter.timestamp.$gte = filters.startDate;
    }
    if (filters.endDate) {
      // si j'ai une valeur pour endDate --> les timestamps doivent être inféreiru (lesser --> $lte) à filters.endData
      mongoFilter.timestamp.$lte = filters.endDate;
    }
  }

  // recherche dans la BDD tous les document, puis transforme le resultat en tableau
  // const result = await collection.find({}).toArray();
  // return result;
  const logs: Array<LogDocument> = await collection.find(mongoFilter)
    .sort({ timestamp: -1, _id: -1 }) // trier les résultats dabord par timestamp, puis si timestamp identique, trie par _id : -1 indique ordre décroissent ; 1 ordre croissant
    .limit(filters.limit) // limiter le nombre max de résultat
    .skip(filters.offset) // ignore les N (filters.offset) premiers résultats
    .toArray(); // même instructon en plus court

  // construit le résultat de la fonction (une instance de LogsWithPagination) avec logs (résultats de la fonction find)
  const result: LogsWithPagination = {
    logs, // liste des logs retournés par find
    total: logs.length // nombre de logs 
  }

  return result;
}


export async function createBatch(batch: logValidator.Batch): Promise<InsertManyResult<LogDocument>> {

  const result = await collection.insertMany(batch.logs);

  if (!result || !result.acknowledged) {
    // pas de réponse du service, 
    // TODO comparer le nombre de logs dans le batch (à enregistrer) avec result.insertedCount --> nombre de document réellement enregistré
    throw new Error("Failed save batch");
  }

  return result;
}



export interface LogStats {
  totalLogs: number;
  logsByLevel: Record<string, number>;
  logsByService: Record<string, number>;
  logsByEnvironment: Record<string, number>;
}



export async function getStats(filters: logValidator.StatFilter): Promise<LogStats> {

  // Construction du filtre MongoDB
  const mongoFilter: any = {};

  if (filters.service) mongoFilter.service = filters.service;
  if (filters.environment) mongoFilter.environment = filters.environment;

  if (filters.startDate || filters.endDate) {
    mongoFilter.timestamp = {};
    if (filters.startDate) mongoFilter.timestamp.$gte = filters.startDate;
    if (filters.endDate) mongoFilter.timestamp.$lte = filters.endDate;
  }

  // Exécution des agrégations en parallèle
  const [
    totalLogs,
    logsByLevel,
    logsByService,
    logsByEnvironment
  ] = await Promise.all([
    // Nombre total de logs
    collection.countDocuments(mongoFilter),

    // Répartition par niveau
    collection.aggregate([
      { $match: mongoFilter },
      { $group: { _id: '$level', count: { $sum: 1 } } }
    ]).toArray(),

    // Répartition par service (top 20)
    collection.aggregate([
      { $match: mongoFilter },
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]).toArray(),

    // Répartition par environnement
    collection.aggregate([
      { $match: mongoFilter },
      { $group: { _id: '$environment', count: { $sum: 1 } } }
    ]).toArray()
  ]);


  
  // Transformation des résultats en format plus lisible
  const stats: LogStats = {
    totalLogs,

    logsByLevel: logsByLevel.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>),
    
    logsByService: logsByService.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>),
    
    logsByEnvironment: logsByEnvironment.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>)
  };

  return stats;
}