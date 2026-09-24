import { Request } from "express";
import { Role } from "../../generated/prisma/enums.ts";

// une autre manière d'étendre l'interface Request de express
// ajoute requesId et log dans Request
declare global {
  namespace Express {
    interface Request {
      // Pour les logs des requêtes HTTP
      requestId?: string;
      logger?: winston.Logger;
    }
  }
}

// définition de ma propre request qui hérite de Request fournie par Express
// elle possède toutes les propriétés de Request
// avec en plus userId et userRole
export interface AuthenticatedRequest extends Request {

  // ici on hérite, donc on récupère tout ce qui constitue Request définie par express

  // ? pour indiquer que la propriété est optionnelle
  userId?: number,
  userRole?: Role,
}