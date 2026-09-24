// api/src/middlewares/log-request.middleware.ts
import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../lib/logger.ts';
import type winston from 'winston';

export function logRequest(req: Request, res: Response, next: NextFunction) {
  // identifiant de la requête ou id aléatoire
  const id = req.get('x-request-id') || randomUUID();
  // injecte l'id de la requete dans requestId
  req.requestId = id;
  // En cas de traitement dans un autre service, on injecte l'id dans la response
  res.setHeader('x-request-id', id);
  // on utilise un logger spécifique pour les log des requetes HTTP
  // logger.child() crée une copie du logger avec des informaitions spécifiques (paramètre de la fonction child) à ajouter dans tous les prochains log 
  // httpLogger possède donc les même propriétés et même transports que logger 
  // httpLogger possède en plus requestId qui sera inséré automatiquement dans tous ses prochains logs
  const httpLogger: winston.Logger = logger.child({ requestId: id });
  req.logger = httpLogger;
  // On utilise process.hrtime.bigint() pour avoir une précision plus grande : https://nodejs.org/api/process.html#processhrtimebigint
  const start = process.hrtime.bigint();

  // on finish --> fonction appellée automatiquement à la fin du traitement de la requete
  res.on('finish', () => {
    // calcule la durée d'exécution de la requete avec start
    const duration = Number(process.hrtime.bigint() - start) / 1e6;
    // log la requête avec le childlogger injecté dans la requete --> niveau de log http
    // premier argument est le message du log
    req.logger?.http('HTTP request', {
      method: req.method, // méthode HTTP
      path: req.originalUrl, // url demandée
      status: res.statusCode, // status code réponse
      durationMs: Math.round(duration), // durée de traitement de la requete
      ip: req.ip, // IP du client
      userAgent: req.get('user-agent'), // user agent du client
    });
  });

  next();
}