import { Router } from "express";
import { Role } from "../../generated/prisma/enums.ts";
import * as levelController from "../controllers/levels.controller.ts";
import { checkRoles } from "../middlewares/access-control.middleware.ts";

export const router = Router();




/**
 * @openapi
 * /levels:
 *   get:
 *     tags:
 *       - Levels
 *     summary: Lister les niveaux
 *     description: Accessible aux rôles member, author et admin.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Tous les niveaux, sans pagination.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/Level"
 *       "401":
 *         description: Cookie accessToken absent ou expiré, identité invalide, ou rôle non
 *           autorisé (comportement actuel).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *       "500":
 *         description: Erreur interne, erreur Prisma non traitée ou JWT malformé.
 */
router.get("/levels", checkRoles([Role.admin, Role.author, Role.member]), levelController.getAllLevels);



/**
 * @openapi
 * "/levels/{id}":
 *   parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       description: Identifiant de la ressource.
 *       schema:
 *         type: integer
 *         minimum: 1
 *   get:
 *     tags:
 *       - Levels
 *     summary: Consulter un niveau
 *     description: Accessible aux rôles member, author et admin.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "200":
 *         description: Niveau trouvé.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Level"
 *       "401":
 *         description: Cookie accessToken absent ou expiré, identité invalide, ou rôle non
 *           autorisé (comportement actuel).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *       "404":
 *         description: Niveau inexistant.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LevelError"
 *       "500":
 *         description: Erreur interne, erreur Prisma non traitée ou JWT malformé.
 */
router.get("/levels/:id", checkRoles([Role.admin, Role.author, Role.member]), levelController.getLevel);



/**
 * @openapi
 * /levels:
 *   post:
 *     tags:
 *       - Levels
 *     summary: Créer un niveau
 *     description: Accessible aux rôles author et admin. Un nom vide ou trop long
 *       provoque actuellement une réponse 500.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/LevelInput"
 *     responses:
 *       "201":
 *         description: Niveau créé.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Level"
 *       "401":
 *         description: Cookie accessToken absent ou expiré, identité invalide, ou rôle non
 *           autorisé (comportement actuel).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *       "409":
 *         description: Nom de niveau déjà utilisé.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LevelError"
 *       "422":
 *         description: Nom absent ou de type incorrect.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LevelError"
 *       "500":
 *         description: Erreur interne, erreur Prisma non traitée ou JWT malformé.
 */
router.post("/levels", checkRoles([Role.admin, Role.author]), levelController.createLevel);



/**
 * @openapi
 * "/levels/{id}":
 *   parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       description: Identifiant de la ressource.
 *       schema:
 *         type: integer
 *         minimum: 1
 *   patch:
 *     tags:
 *       - Levels
 *     summary: Renommer un niveau
 *     description: Accessible aux rôles author et admin. Un nom vide ou trop long
 *       provoque actuellement une réponse 500.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/LevelInput"
 *     responses:
 *       "200":
 *         description: Niveau modifié.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Level"
 *       "401":
 *         description: Cookie accessToken absent ou expiré, identité invalide, ou rôle non
 *           autorisé (comportement actuel).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *       "404":
 *         description: Niveau inexistant.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LevelError"
 *       "409":
 *         description: Nom de niveau déjà utilisé.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LevelError"
 *       "422":
 *         description: Nom absent ou de type incorrect.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LevelError"
 *       "500":
 *         description: Erreur interne, erreur Prisma non traitée ou JWT malformé.
 */
router.patch("/levels/:id", checkRoles([Role.admin, Role.author]), levelController.updateLevel);



/**
 * @openapi
 * "/levels/{id}":
 *   parameters:
 *     - name: id
 *       in: path
 *       required: true
 *       description: Identifiant de la ressource.
 *       schema:
 *         type: integer
 *         minimum: 1
 *   delete:
 *     tags:
 *       - Levels
 *     summary: Supprimer un niveau
 *     description: Accessible aux rôles author et admin.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       "204":
 *         description: Niveau supprimé, sans corps de réponse.
 *       "401":
 *         description: Cookie accessToken absent ou expiré, identité invalide, ou rôle non
 *           autorisé (comportement actuel).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *       "404":
 *         description: Niveau inexistant.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/LevelError"
 *       "500":
 *         description: Erreur interne, erreur Prisma non traitée ou JWT malformé.
 */
router.delete("/levels/:id", checkRoles([Role.admin, Role.author]), levelController.deleteLevel);







/**
 * @openapi
 * components:
 *   schemas:
 *     Level:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: integer
 *           minimum: 1
 *         name:
 *           type: string
 *           maxLength: 50
 *           example: Facile
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     LevelInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 1
 *           description: Nom unique. La BDD limite sa longueur à 50 caractères.
 *           example: Facile
 *     ApiError:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error:
 *           type: string
 *         status:
 *           type: integer
 *         stacktrace:
 *           type: string
 *     LevelError:
 *       type: object
 *       required:
 *         - error
 *       properties:
 *         error:
 *           type: string
 */
