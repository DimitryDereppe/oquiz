import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import z from "zod";
import { HttpClientError } from "../lib/errors.ts";
import { logger } from "../lib/logger.ts";
import { config } from "../../config.ts";

/**
 * La stack trace n'est renvoyée au client qu'en développement : en production elle
 * révélerait la structure interne du serveur (elle reste tracée dans les logs).
 * @param error - erreur interceptée
 * @returns un objet à fusionner dans la réponse JSON ({ stacktrace } ou vide)
 */
function devStacktrace(error: Error) {
  return config.nodeEnv === "development" ? { stacktrace: error.stack ?? "" } : {};
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// Plusieurs façon d'appeler ce middleware :
// - dans un controlleur en amont, `next(error)`
// - depuis Express 5, il suffit de throw une erreur dans un controlleur async pour que l'erreur soit transmise ici
export function globalErrorHandler(error: Error, req: Request, res: Response, next: NextFunction) { // 4 arguments, c'est spécifique à Express et c'est obligatoire

  // 1) Erreurs de validation Zod 
  if (error instanceof z.ZodError) {
    // console.info('ZodError', error);
    // log de l'erreur, niveau "error"
    // avec dans les meta données, l'erreur zod + la cause si déterminée
    logger.error("Zod error", {
      error: z.prettifyError(error),
      cause: error.cause ?? ''
    });

    return res.status(400).json({
      error: z.prettifyError(error),
      status: 400, // Bad request
      ...devStacktrace(error)
    });
  }

  // 2) Erreur JWT token expiré
  if (error instanceof jwt.TokenExpiredError) {
    // console.info('TokenExpiredError', error);
    logger.error("JWT error", {
      error: error.message,
      cause: error.cause ?? ''
    });

    return res.status(401).json({
      error: error.message,
      status: 401
    });
  }

  // 3) Erreurs HttpClientError (../lib/errors.ts)
  // Gère tous les HttpClientError --> attrape toutes les classes filles de HttClientError
  // - ex : throw new NotFoundError()
  // - ex : throw new ConflictError()
  if (error instanceof HttpClientError) {
    // console.info('HttpClientError', error); // Niveau info pour la traçabilité
    logger.error("HTTP error", {
      error: error.message,
      status: error.status ?? '',
      stack: error.stack ?? ''
    });

    return res.status(error.status).json({
      error: error.message,
      status: error.status,
      ...devStacktrace(error)
    });
  }

  // Si l'erreur arrive à ce stade, il faut la logger avec un niveau approprié
  // console.error('Internal server error', error);
  logger.error("HTTP Client error", {
    error: error.message,
    cause: error.cause ?? '',
    stack: error.stack ?? ''
  });

  // 4) Gérer toutes les erreurs suivantes : code 500
  // Toutes les erreurs non traitées au dessus
  // - ex : la BDD plante
  // - ex : on a fait une erreur de syntaxe
  res.status(500).json({
    error: 'Internal server error',
    status: 500,
    ...devStacktrace(error)
  });
}
