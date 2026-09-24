import type { AuthenticatedRequest } from "../@types/express.js";
import { UnauthorizedError } from "../lib/errors.ts";
import type { User } from "../../generated/prisma/client.ts";
import { prisma } from "../models/index.ts";

// --------------------------------
// recherche un utilisateur dans la BDD selon son id stocké dans AuthenticatedRequest.userId
// --------------------------------
export async function getAuthenticatedUser(req: AuthenticatedRequest): Promise<User> {

  // userId stocké dans AuthenticatedRequest
  const userId = req.userId;

  if (!userId) {
    // userId n'existe pas --> erreur
    throw new UnauthorizedError("Utilisateur non authentifié");
  }

  // recherche de l'utilisateur dans la BDD
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    // user pas trouvé dans la BDD --> erreur
    throw new UnauthorizedError("Utilisateur non trouvé");
  }

  return user;
}
