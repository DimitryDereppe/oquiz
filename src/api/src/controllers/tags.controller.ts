import type { Request, Response } from "express";
import { prisma } from "../models/index.ts";
import z from "zod";
// import { parseIdFromParams } from "./utils.ts";
import { ConflictError, ForbiddenError, NotFoundError } from "../lib/errors.ts";
import { Role, type Tag } from "../../generated/prisma/client.ts";
import { AuthenticatedRequest } from "../@types/express.js";


// --------------------------------
// GET /tags
// --------------------------------
export async function getAllTags(req: Request, res: Response) {

  // BONUS : on améliore la route avec quelques query params :
  // GET /api/tags  ?limit=10  &page=2  &authorId=1  &order=name:asc  

  // Query params validation and default values
  const { page, limit, authorId, order } = await z.object({
    limit: z.coerce.number().int().min(1).optional().default(20),
    page: z.coerce.number().int().min(1).optional().default(1),
    authorId: z.coerce.number().int().min(1).optional(),
    order: z.enum(["name:asc", "name:desc"]).default("name:asc").optional(),
  }).parseAsync(req.query);

  // Get tags from database
  const tags = await prisma.tag.findMany(
    {
      // paramètres pour faire des recherches avancées (des filtres) avec prisma
      // ...() --> ajoute le résultat des parenthèeses seulement si ok
      // authorId && { where: { authorId } } --> si authorId existe, retourne { where: { authorId } }
      ...(authorId && { where: { authorId } }),
      ...(page && { skip: (page - 1) * limit }), // ignore les premiers résultats : (page -1) x nombre résultat par page
      ...(limit && { take: limit }), // nombre maximal de résultat
      orderBy: [
        (order === "name:asc") ? { name: "asc" } : {},
        (order === "name:desc") ? { name: "desc" } : {},
      ]
    });

  // Respond to client
  res.json(tags);
}


// --------------------------------
// GET /tags/:id
// --------------------------------
export async function getOneTag(req: Request, res: Response) {
  // Get ID from params
  const tagId: number = Number(req.params.id);

  // Query database
  const tag = await prisma.tag.findUnique({
    where: { id: tagId },
    include: {
      author: { select: { id: true, firstname: true, lastname: true } }, // injecte l'auteur du tag, seulement son id, firstname et lastname
      parentTag: true,
      childrenTags: true
    }
  });

  if (!tag) { throw new NotFoundError("Tag not found"); }

  // Respond to client
  res.json(tag);
}


// --------------------------------
// POST /tags
// --------------------------------
export async function createTag(req: AuthenticatedRequest, res: Response) {
  // Body validation with optional properties
  const createTagBodySchema = z.object({
    name: z.string().min(1),
    color: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "color property should be an hexadecimal color such as #ff00ff when provided").optional(),
    parentTagId: z.number().int().min(1).optional()
  });
  const { name, color, parentTagId } = await createTagBodySchema.parseAsync(req.body);

  // récupère l'utilisateur enregistré dans la requete (voir isConnected)
  const userId = req.userId;
  if (!userId) {
    throw new ConflictError("User undefined");
  }

  // Other validations
  await assertUniqueName(name);
  if (parentTagId) { await assertParentTagExists(parentTagId); };

  // Insertion
  const tag = await prisma.tag.create(
    {
      data: {
        name,
        authorId: userId,
        ...(color && { color }), // si color est défini --> ajoute { color } dans la requete d'insertion
        ...(parentTagId && { parentTagId }) // si parentTagId est définit --> ajoute { parentTagId } dans la requetye
      }
    });

  // Respond to client
  res.status(201).json(tag);
}


// --------------------------------
// PATCH /tags/:id
// --------------------------------
export async function updateTag(req: AuthenticatedRequest, res: Response) {
  // Params and body parsing
  const tagId: number = Number(req.params.id);

  const { name, color, parentTagId } = await z.object({
    name: z.string().min(1).optional(),
    color: z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, "color property should be an hexadecimal color such as #ff00ff when provided").nullable().optional(),
    parentTagId: z.number().int().min(1).nullable().optional() // nullable => on peut RETIRER le parentTagId
  }).parseAsync(req.body);

  // Retrieve tag
  const tag = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tag) { throw new NotFoundError("Tag not found"); }

  // vérifie que l'utilisateur enregistré dans la requete a le droit de modifier le tag
  assertUserCanManageTag(tag, req);

  // Other body validations
  if (name) { await assertUniqueName(name); }
  if (parentTagId) { await assertParentTagExists(parentTagId); }

  // Update the tag 
  const updatedTag = await prisma.tag.update({
    where: { id: tagId },
    data: {
      // pour modifier les champs (si l'utilisateur rempli les valeurs)
      ...(name && { name }),
      // conserve la valeur null si explicite dans le json. exemple : { "color": null } --> couleur passe a null
      ...(color !== undefined && { color }),
      ...(parentTagId !== undefined && { parentTagId }),
    }
  });

  // Respond to client
  res.json(updatedTag);
}


// --------------------------------
// DELETE /tags/:id
// --------------------------------
export async function deleteTag(req: AuthenticatedRequest, res: Response) {
  const tagId: number = Number(req.params.id);

  const tag = await prisma.tag.findUnique({ where: { id: tagId } });
  if (!tag) { throw new NotFoundError("Tag not found"); }

  // vérifie que l'utilisateur enregistré dans la requete a le droit de modifier le tag
  assertUserCanManageTag(tag, req);

  await prisma.tag.delete({ where: { id: tagId } });
  res.status(204).json();
}


// ===========
// ** Utils **
// ===========

// --------------------------------
// vérifie si un tag peut être modifié par l'utilisateur identifié dans req.userId (voir isConnected)
// --------------------------------
function assertUserCanManageTag(tag: Tag, req: AuthenticatedRequest) {
  // Si l'utilisateur est administrateur, il a tous les droits sur le tag
  if (Role.admin == req.userRole) { return; }

  // Si l'utilisateur est author, et qu'il est le créateur du tag, il a tous les droits sur le tag
  if (Role.author == req.userRole && req.userId === tag.authorId) { return; }

  // Erreur --> Forbidden
  throw new ForbiddenError(`User ${req.userId} cannot manage tag ${tag.id}`);
}


// --------------------------------
// vérifie que le nom du tag n'existe pas déjà
// --------------------------------
async function assertUniqueName(name: string) {
  const alreadyTakenName = await prisma.tag.count({ where: { name } });
  if (1 == alreadyTakenName) { throw new ConflictError("Tag name is already taken"); }
}

// --------------------------------
// vérifie que le parent d'un tag existe s'il est fourni
// --------------------------------
async function assertParentTagExists(parentTagId: number) {
  const parentTag = await prisma.tag.findUnique({ where: { id: parentTagId } });
  if (!parentTag) { throw new NotFoundError(`Parent tag ${parentTagId} does not exist`); }
}
