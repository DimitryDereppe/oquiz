import argon2 from "argon2";
import type { Request, Response } from "express";
import z from 'zod';
import { AuthenticatedRequest } from "../@types/express.js";
import { BadRequestError, ConflictError, UnauthorizedError } from "../lib/errors.ts";
import * as libTokens from "../lib/tokens.ts";
import { isValidPassword } from '../lib/validators.ts';
import { prisma } from "../models/index.ts";
import { getAuthenticatedUser } from "./utils.ts";


// --------------------------------
// POST /auth/register
// --------------------------------
export async function register(req: Request, res: Response) {

  // schema attendu du body
  const registerUserBodySchema = z.object({
    firstname: z.string().min(1),
    lastname: z.string().min(1),
    email: z.email(),
    password: z.string(),
    confirm: z.string(),
  });

  // validation du body par Zod
  const { firstname, lastname, email, password, confirm } = await registerUserBodySchema.parseAsync(req.body);

  // compare password / confirm
  if (password != confirm) {
    throw new BadRequestError("Password and confirmation do not match");
  }

  // password valide ?
  if (!isValidPassword(password)) {
    throw new BadRequestError("Password invalid");
  }

  // vérifier dans la BDD si l'email n'existe pas déjà ?
  const searchedUser = await prisma.user.findFirst({ where: { email } });
  if (searchedUser) {
    throw new ConflictError("User already exists");
  }

  // hash du mot passe
  const hashedPassword = await argon2.hash(password);

  // registre le nouvel utilisateur dans la BDD
  // newUser contient le nouvel utilisateur créé
  const newUser = await prisma.user.create({
    data: {
      firstname,
      lastname,
      email,
      password: hashedPassword
    },
    omit: {
      password: true, // Le champ 'password' ne sera pas renvoyé dans la variable 'newUser'
    },
  });

  // renvois le code 201 avec le nouvel utilisateur créé
  res.status(201).json(newUser);
}


// --------------------------------
// POST /auth/login
// --------------------------------
export async function login(req: Request, res: Response) {

  // schema attendu du body
  const loginUserBodySchema = z.object({
    email: z.email(),
    password: z.string(),
  });

  // validation du body par Zod
  const { email, password } = await loginUserBodySchema.parseAsync(req.body);

  // rechercher l'utilisateur dans la BDD selon son email
  const searchedUser = await prisma.user.findFirst({ where: { email } });
  if (!searchedUser) {
    throw new UnauthorizedError("User does not exist");
  }

  // searchedUser.password --> mot de passe hashé et stocké dans la BDD
  // password --> mot de passe en clair reçu du body
  if (!await argon2.verify(searchedUser.password, password)) {
    throw new UnauthorizedError("Password invalid");
  }

  // générer les tokens avec leurs cookies
  const cookies = await libTokens.generateAuthenticationCookies(searchedUser);

  // début d'une transaction pour gérer les token stockés en BDD
  // si la transaction échoue, une erreur est lancée automatiquement puis attrappée par le global-error-handler

  await prisma.$transaction(async (tx) => {
    // 1. revoquer tous les tokens de l'utilisateur
    await libTokens.revokeAllUserRefreshTokensInTx(tx, searchedUser);

    // nettoyage : supprime tous les token expirés de l'utilisateur
    await libTokens.clearUserRefreshTokenInTx(tx, searchedUser);

    // 2. créer un nouveau token valide (consumed false)
    // la contrainte unique sur [user_id + consumed: false] garanti qu'un utilisateur a un seul token valide
    await libTokens.createRefreshTokenInTx(tx, searchedUser, cookies.refreshCookie.token);
  });

  libTokens.insertCookieInResponse(res, cookies.accessCookie);
  libTokens.insertCookieInResponse(res, cookies.refreshCookie);

  res.status(200).json({ message: "success" });
}


// --------------------------------
// GET /auth/me
// --------------------------------
export async function getMe(req: AuthenticatedRequest, res: Response) {

  const user = await getAuthenticatedUser(req);

  // envoi la réponse avec user
  res.status(200).json({
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email
  });
}


// --------------------------------
// POST /auth/refresh
// --------------------------------
export async function refresh(req: Request, res: Response) {

  // 1. récupérer le refresh token dans les cookies
  const refreshToken = req.cookies?.[libTokens.REFRESH_COOKIE.name];

  // refreshToken existe et est un string ? (certains cookies peuvent être du JSON...)
  if (!refreshToken || typeof refreshToken !== "string") {
    throw new UnauthorizedError("Refresh token is missing");
  }

  // il faut une transaction pour effectuer les opération du refresh
  // si la transaction échoue, une erreur est lancée automatiquement puis attrappée par le global-error-handler
  // il faut récupérer le résultat de la transaction
  // définition du type de retour de la transaction : ok ou fail
  type RefreshResult =
    | { ok: true; cookies: libTokens.AuthenticationCookies } // ok avec les cookies générés
    | { ok: false; reason: string; }; // fail avec une raison de l'echec au format string

  // début de la transaction
  const result = await prisma.$transaction(async (tx): Promise<RefreshResult> => {

    // la difficulté du refresh est de gérer correction les requêtes concurentes (simultanée) de refresh
    // on cherche le token une première fois dans la BDD pour récupérer l'utilisateur associé 
    // et vérifier que le token n'est pas déjà consommé
    // puis lorsqu'on consomme le token, il faut de nouveau vérifier que le token n'est pas déjà consommé !

    const now = new Date(); // maintenant

    // calcul du hash du refreshToken --> l'algorithme utilisé est déterministe
    // le hash est donc le même que celui stocké dans la BDD
    const hash = libTokens.getTokenHash(refreshToken);

    // 1. chercher le token avec son utilisateur : include: { user: true }
    const token = await tx.refreshToken.findUnique({
      where: {
        tokenHash: hash,
      },
      include: { user: true } // ajoute l'utilisateur associé au token dans la réponse
    });

    // token non trouvé ou expiré --> erreur --> refuser le refresh
    if (!token || token.expiresAt <= now) {
      return { ok: false, reason: "Token invalide" };
    }

    // token déjà consommé --> erreur --> refuser le refresh
    if (token.consumed) {
      // révoquer tous les tokens de l'utilisateur
      await libTokens.revokeAllUserRefreshTokensInTx(tx, token.user);
      // refuser la requete
      return { ok: false, reason: "Token déjà utilisé" };
    }

    // 2. le token est valide, on le consomme
    if (!await libTokens.consumeRefreshTokenInTx(tx, token)) {
      // le token a déjà été consommé par une autre requête "simultanée" --> erreur --> refuser le refresh
      // révoquer tous les tokens de l'utilisateur
      await libTokens.revokeAllUserRefreshTokensInTx(tx, token.user);
      // on refuse la requete
      return { ok: false, reason: "Token déjà utilisé" };
    }

    // 3. le token a bien été consommé, on continue
    const cookies: libTokens.AuthenticationCookies = await libTokens.generateAuthenticationCookies(token.user);

    // 4. enregistrer le nouveau token dans la BDD 
    // la création se fait avec la transaction
    await libTokens.createRefreshTokenInTx(tx, token.user, cookies.refreshCookie.token);

    // nettoyage : supprime tous les token expirés de l'utilisateur
    await libTokens.clearUserRefreshTokenInTx(tx, token.user);

    // tout va bien, on retourne les cookies de transport des tokens
    return { ok: true, cookies };
  });

  if (result.ok) {
    // le refreshToken est bien créé dans la BDD
    // enregistre les token dans le header de la réponse
    libTokens.insertCookieInResponse(res, result.cookies.accessCookie);
    libTokens.insertCookieInResponse(res, result.cookies.refreshCookie);

    // envois la réponse 200 OK
    res.status(200).json({ message: "refresh token" });
  } else {
    throw new UnauthorizedError(result.reason);
  }
}


// --------------------------------
// POST /auth/logout
// --------------------------------
export async function logout(req: AuthenticatedRequest, res: Response) {

  // rechercher l'utilisateur depuis le userId de la requete
  const user = await getAuthenticatedUser(req);

  // nouvelle transaction pour révoquer tous les tokens de l'utilisateur
  await prisma.$transaction(async (tx) => {
    // logout --> revoke all tokens of the user
    await libTokens.revokeAllUserRefreshTokensInTx(tx, user);
  });


  // un acces token vide
  const emptyAccessToken: libTokens.Token = {
    name: libTokens.ACCESS_COOKIE.name,
    content: "", // vide
    expiresInMS: 0 // maintenant
  };
  // access cookie
  const accessCookie = libTokens.newAccessCookie(emptyAccessToken);
  // supprimer l'access cookie dans la réponse
  libTokens.clearCookieInResponse(res, accessCookie);



  // un refresh token vide
  const emptyRefreshToken: libTokens.Token = {
    name: libTokens.REFRESH_COOKIE.name,
    content: "", // vide
    expiresInMS: 0 // maintenant
  };
  // refresh cookie
  const refreshCookie = libTokens.newRefreshCookie(emptyRefreshToken);
  // supprimer le refresh cookie de la réponse
  libTokens.clearCookieInResponse(res, refreshCookie);

  
  res.status(204).json({ message: "loged out" });
}