import { NextFunction, Response } from "express";
import type { JwtPayload } from "jsonwebtoken";
import jwt from "jsonwebtoken";
import { config } from "../../config.ts";
import { Role } from "../../generated/prisma/enums.ts";
import { AuthenticatedRequest } from "../@types/express.js";
import { UnauthorizedError } from "../lib/errors.ts";
import * as libTokens from "../lib/tokens.ts";


// --------------------------------
// fonction technique TypeScript pour tranformer value en type Role prisma
function isRole(value: unknown): boolean {
  return Object.values(Role).some((role) => role === value);
}


// --------------------------------
// middleware pour vérifier si l'utilisateur est connecté --> access token valide
export async function isConnected(req: AuthenticatedRequest, res: Response, next: NextFunction) {

  // récupérer l'accessToken qui se trouve dans le cookie de la requete 
  const accessToken = req.cookies?.[libTokens.ACCESS_COOKIE.name];

  // est-ce j'ai un cookie avec un accessToken dedans ?
  if (!accessToken || typeof accessToken !== "string") {
    throw new UnauthorizedError('Access token invalide');
  }

  // est-ce que l'accessToken est un token JWT valide ?
  // si le token est invalide, verify lance une erreur attrapée par le global-error-handler
  const payload = jwt.verify(accessToken, config.jwtSecret) as JwtPayload;

  // dans payload j'ai un objet JS avec des "trucs" dedans
  // je dois vérifier si paylaod contient bien userId et userRole

  // est-ce que j'ai bien userId dans la payload ?
  const userId = payload.userId;
  // transforme userId en nombre 
  if (typeof userId !== "number" || !Number.isInteger(userId) || userId <= 0) {
    throw new UnauthorizedError("Invalid user ID in access token");
  }

  // est-ce que j'ai bien userRole dans la paylaod ?
  const userRole = payload.userRole;
  if (!isRole(userRole)) {
    throw new UnauthorizedError("Role invalide");
  }

  // je suis arrivé ici : accessToken est valide
  // aucune erreur de lancée --> utilisateur a founi un token valide --> utilisateur connecté
  // userId et userRole sont bien présents dans la paylaod
  // injecter userId et userRole dans la requete
  req.userId = userId;
  req.userRole = userRole;

  next();
}


// --------------------------------
// vérifier les rôles des utilisateurs connectés
// une fonction qui prend en arguemnt la liste des roles autorisés
export function checkRoles(allowedRoles: Array<Role>) {

  // exemple : allowedRoles contient : [ "admin" ]
  // req.userRole = "member"
  // "member" n'est pas dans le tableau allowedRoles --> rejette la requete

  // la fonction checkRole retourne un middleware qui vérfie si le role est autorisé ou pas
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

    // récupère le role injecté dans l'AuthenticatedRequest
    const role = req.userRole;
    // si pas de role --> erreur
    if (!role) {
      throw new UnauthorizedError('Role invalide');
    }

    // vérifie si role est inclus dans la liste des roles possible (allowedRoles)
    if (!allowedRoles.includes(role)) {
      // le role de l'utilisateur n'est pas dans la liste des roles autorisés
      throw new UnauthorizedError('Not allowed');
    }

    // tout va bien, appelle le middleware suivant
    next();
  };
}
