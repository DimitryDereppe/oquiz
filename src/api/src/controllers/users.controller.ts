import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";

export async function getAllUsers(req: Request, res: Response) {

  // omit permet de supprimer le mot de passe dans le résultat de recherche
  // Source: https://www.prisma.io/docs/orm/v6/prisma-client/queries/excluding-fields
  const users = await prisma.user.findMany({
    omit: {
      password: true,
    }
  });

  res.json(users);
}
