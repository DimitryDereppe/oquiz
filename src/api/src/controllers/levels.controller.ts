// Il faut importer les typages de res et req en typescript
import type { Request, Response } from "express";

// On importe prisma pour pouvoir appeller la BDD
import { prisma } from "../models/index.ts";

// On importe Zod (c'est comme joi)
// CF : https://zod.dev
import * as z from "zod";

export async function getAllLevels(req: Request, res: Response) {

  try {
    // Récupérer tous les levels depuis la BDD
    const levels:Array<object> = await prisma.level.findMany();

    // On retourne les levels
    res.status(200).json(levels);

  } catch (error) {
        
    // Pour gérer les erreurs éventuelles
    res.status(500).json({error});
  }

}

export async function getLevel(req: Request, res: Response) {

  try {

    // On récupère le paramètre
    const id:number = Number(req.params.id);

    // Récupère un level depuis la BDD
    const level:object | null = await prisma.level.findUnique({where: { id }});

    // Gestion de l'erreur en cas d'élément non trouvé
    // Si vous renvoyez avec res quelque chose, alors, la suite de la fonction n'est pas lu !
    if (level === null) {

      res.status(404).json({error: "No level found"});

      // Le return permet d'arreter la fonction ici.
      // Si on ne le met pas, la ligne d'après sera lu également.
      return;
            
    }

    // On retourne le level
    res.status(200).json(level);

  } catch(error) {

    res.status(500).json({error});

  }

}

export async function createLevel(req: Request, res: Response) {

  try {
    // Créer notre schéma Zod
    const Level = z.object({
      name: z.string().min(1)
    });

    // On va valider notre donner récupérée du body avec Zod
    const data = Level.parse(req.body);

    // On insère en BDD notre donnée
    // { data } est l'équivalent de { data: data }
    const createdLevel = await prisma.level.create({ data });

    res.status(201).json(createdLevel);

  } catch (error: any) {

    if(error.code === "P2002") {
      res.status(409).json({error: "Level already exist on database"});
      return;
    }

    // Documentation : https://zod.dev/basics#handling-errors
    if(error instanceof z.ZodError) {
      if(error.issues[0].code === "invalid_type") {
        res.status(422).json({error: "You should use the required properties"});
        return;
      }
    }

    // console.error(error)
    res.status(500).json(error);
  }

}

export async function updateLevel(req: Request, res: Response) {

  try {
    // On récupère le body
    const name:string = req.body.name;

    // On récupère le paramètre id
    const id:number = Number(req.params.id);

    // On crée un Schéma Zod
    const Level = z.object({
      // On vérifie que le name est bien une string avec au minimum 1 caractère
      name: z.string().min(1)
    });

    // On vérifie que le body colle à ce Schema
    // { name } est l'équivalent de { name: name }
    const data:object = Level.parse({name});

    // On modifie la valeur du level
    // { data } est l'équivalent de { data: data }
    // { id } est l'équivalent de { id: id }
    const level = await prisma.level.update({
      where: {id},
      data
    });

    // On retourne le level modifier
    res.status(200).json(level);
  } catch (error: any) {

    // Gestion de l'erreur en cas de niveau inexistant
    if(error.code === "P2025") {
      res.status(404).json({error: "Level doesn't exist"});
      return;
    }

    // Erreur 409 si le level existe déjà en BDD
    if(error.code === "P2002") {
      res.status(409).json({error: "Level already exist on database"});
      return;
    }

    // Documentation : https://zod.dev/basics#handling-errors
    if(error instanceof z.ZodError) {
      if(error.issues[0].code === "invalid_type") {
        res.status(422).json({error: "You should use the required properties"});
        return;
      }
    }

    res.status(500).json({error});
  }
    
}

export async function deleteLevel(req: Request, res: Response) {

  try {
    // On récupère le paramètre
    const id:number = Number(req.params.id);

    // On utilise prisma pour supprimer le level
    const level = await prisma.level.delete({
      where: {id}
    });

    // On retourne le level supprimé
    res.status(204).json(level);
  } catch (error: any) {

    // Gestion de l'erreur en cas de niveau inexistant
    if(error.code === "P2025") {
      res.status(404).json({error: "Level doesn't exist"});
      return;
    }

    // On gère toutes les erreurs potentiels
    res.status(500).json({error});
  }

}