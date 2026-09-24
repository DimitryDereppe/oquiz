import type { Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { config } from "../../config.ts";
import type { Prisma, User, RefreshToken } from "../../generated/prisma/client.ts";

// -------------------------------- 
// SameSite config
// -------------------------------- 
// configuration de l'attribut "sameSite" pour les cookies
// sameSite indique au navigateur depuis quel site il peut renvoyer le cookie vers l'API
// il définit les autorisations d'envoi du cookie selon le site à l'origine de la requête
// ---
// Exemple : l'API est sur le domaine A.com et fournit un cookie. Le cookie appartient au domaine A.com
// le front est sur le domaine B.com est envoie des requêtes vers l'API (A.com)
// sameSite indique si le navigateur a le droit d'envoyer le cookie depuis le domaine B.com vers l'API sur A.com
// --
// ici un site correspond au protocole (HTTP ou HTTPS) + le nom de domaine
// https://front.example.com et https://api.example.com --> mêmes sites
// https://example.com et http://example.com --> protocoles différents --> sites différents
// https://front.example.com et https://autre.com --> domaines différents --> sites différents
export const SameSite = {
  // strict : autorise l'envois du cookie uniquement depuis le même site que l'API pour tout type de requêtes (GET, POST, PATCH, PUT, DELETE)
  // pratique si l'API et le FRONT sont sur le même site
  Strict: "strict",

  // lax : mode strict + autorise l'envoi du cookie depuis d'autres sites que l'API, mais uniquement pour des liens GET
  // pratique pour récupérer du contenu de l'API depuis un autre site
  Lax: "lax",

  // none : autorise l'envoi du cookie depuis d'autres sites que l'API pour tout type de requête
  // pratique si le front et l'API ne sont pas sur le même site
  // attention, dans ce cas le navigateur exige aussi le protocole HTTPS pour le partage du cookie
  // https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html#section-5.7
  None: "none",
} as const;
export type SameSiteType = (typeof SameSite)[keyof typeof SameSite];


// --------------------------------
// caractéristiques des tokens
// --------------------------------
// pour ne pas répéter partout le nom et le path du token
export const ACCESS_COOKIE = {
  name: "accessToken",
  path: "/"
};
export const REFRESH_COOKIE = {
  name: "refreshToken",
  path: "/api/auth/refresh"
};


// --------------------------------
// définition générique des données d'un token
// --------------------------------
// interface --> classe sans fonction
export interface Token {
  name: string; // accessToken ou refreshToken
  content: string; // string JWT ou une string aléatoire pour le refreshToken
  expiresInMS: number; // date d'expiration du token
}


// --------------------------------
// définition générique des données d'un cookie
// --------------------------------
// interface --> classe sans fonction
export interface Cookie {

  token: Token; // interface token définie plus haut

  options: {
    // instructions pour le navigateur (attributs définis par les spec des cookies : https://httpwg.org/http-extensions/draft-ietf-httpbis-rfc6265bis.html)
    httpOnly: boolean; // true : non accessible aux script JS, seul le navigateur y a accès
    maxAge: number; // durée de conservation du cookie en ms --> supprime le cookie passé ce délais --> attention, ce delais porte sur le cookie, pas le token qu'il contient !
    sameSite: SameSiteType; // Valeurs autorisées : "strict", "lax" ou "none"
    secure: boolean; // renvois ce cookie uniquement en HTTPS (exception pour localhost en HTTP --> pratique pour les tests ;)
    path: string; // endpoint où renvoyer le cookie "/" --> racine de l'API  ou "/api/auth/refresh" --> uniquement la route refresh de l'API
  };
}


// --------------------------------
// structure géénrique qui contient les deux cookies à renvoyer au navigateur 
// --------------------------------
export interface AuthenticationCookies {
  accessCookie: Cookie;
  refreshCookie: Cookie;
}


// --------------------------------
// créer les deux coockies à renvoyer dans une Response express 
// --------------------------------
export async function generateAuthenticationCookies(user: User): Promise<AuthenticationCookies> {
  // calcul du accessToken
  const accessToken: Token = generateAccessToken(user);

  // cookie de transport pour l'accessToken
  const accessCookie: Cookie = newAccessCookie(accessToken);

  // calcul du refreshToken
  const refreshToken: Token = generateRefreshToken();

  // cookie de transport pour le refreshToken
  const refreshCookie: Cookie = newRefreshCookie(refreshToken);

  return {
    accessCookie,
    refreshCookie,
  };
}


// --------------------------------
// crée un token JWT qui contient le user id + role et une date d'expiration d'une heure
// --------------------------------
function generateAccessToken(user: User): Token {

  // payload du token JWT
  const payload = {
    userId: user.id,
    userRole: user.role,
  };

  // calcul du token JWT (string)
  const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });

  // object Token à manipuler
  const accessToken: Token = {
    name: ACCESS_COOKIE.name,
    content: token, // JWT
    expiresInMS: 1 * 1000 * 60 * 60, // 1 heure
  };

  return accessToken;
}

// --------------------------------
// crée un access Cookie qui va transporter l'access token
// --------------------------------
export function newAccessCookie(token: Token): Cookie {

  return {
    token,
    options: {
      httpOnly: true,
      maxAge: token.expiresInMS, // même durée du vie que le token
      sameSite: SameSite.None, // attention, none : accessCookie peut être partagé avec n'importe quel autre site
      secure: true, // obligatoire avec sameSite: "none"
      path: ACCESS_COOKIE.path, // renvoi le cookie pour tous les endpoints sous la racine /
    },
  };
}


// --------------------------------
// crée un refresh token
// --------------------------------
function generateRefreshToken(): Token {

  // pour le refresh token il faut un identifiant unique, secrêt et non calculable à l'avance
  // une chaîne de caractère aléatoire suffisamment longue 
  // on stocke la string en base64 --> une manière d'encoder du texte de manière consise
  const randomKey = crypto.randomBytes(256).toString("base64");

  const refreshToken: Token = {
    name: REFRESH_COOKIE.name,
    content: randomKey,
    expiresInMS: 1 * 1000 * 60 * 60 * 24 * 7, // 1 semaine
  };

  return refreshToken;
}


// --------------------------------
// crée le refresh Cookie qui va transporter le refresh token
// --------------------------------
export function newRefreshCookie(token: Token): Cookie {

  return {
    token,
    options: {
      httpOnly: true,
      maxAge: token.expiresInMS, // même durée du vie que le token
      sameSite: SameSite.None,
      secure: true, // obligatoire avec sameSite: "none"
      path: REFRESH_COOKIE.path, // renvoi le cookie uniquement pour le endpoint /api/auth/refresh
    },
  };
}


// --------------------------------
// enregistre un cookie dans une Response express
// --------------------------------
export function insertCookieInResponse(res: Response, cookie: Cookie): void {
  // la fonction res.cookie prend 3 arguments :
  // - nom du cookie : string
  // - valeur du cookie : string
  // - options : objet JS
  res.cookie(cookie.token.name, cookie.token.content, cookie.options);
}


// --------------------------------
// supprime un cookie dans une Response express
// --------------------------------
export function clearCookieInResponse(res: Response, cookie: Cookie): void {
  // envois au navigateur des cookies vides avec des dates périmées
  // la fonction res.clearCookie prend deux arguments : 
  // - nom du cookie : string
  // - options : objet JS
  res.clearCookie(cookie.token.name, {
    path: cookie.options.path,
    httpOnly: cookie.options.httpOnly,
    secure: cookie.options.secure,
    sameSite: cookie.options.sameSite
  });
}


// --------------------------------
// consomme les token d'un userId
// --------------------------------
export async function revokeAllUserRefreshTokensInTx(tx: Prisma.TransactionClient, user: User): Promise<void> {

  // exécute la requete UPDATE sur la transaction passée en argument
  // modifie le userId qui a un consummed à false, et le passe à true
  await tx.refreshToken.updateMany({
    where: {
      userId: user.id,
      consumed: false
    },
    data: {
      consumed: true,
    }
  });
}


// --------------------------------
// supprime les token expirés d'un userId
// --------------------------------
export async function clearUserRefreshTokenInTx(tx: Prisma.TransactionClient, user: User): Promise<void> {

  const now = new Date();
  // requete DELETE dans la transaction
  // supprime tous les token de l'userId qui sont consommés et la date d'expiration inférieur à now
  await tx.refreshToken.deleteMany({
    where: {
      userId: user.id,
      expiresAt: { lt: now } // lt --> less than
    }
  });
}


// --------------------------------
// crée un refresh token pour userId
// --------------------------------
// la création se fait dans une transaction : argument tx
export async function createRefreshTokenInTx(tx: Prisma.TransactionClient, user: User, token: Token): Promise<void> {

  // crée un noouveau refresh token pour le userId avec le hash du token et sa date d'expiration
  await tx.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: getTokenHash(token.content),
      expiresAt: new Date(Date.now() + token.expiresInMS),
    },
  });
}


// --------------------------------
// consommer un refresh token
// --------------------------------
// l'opération se fait dans une transaction : argument tx
// retourne vrai si le nombre de ligne modifié est 1, faux sinon
export async function consumeRefreshTokenInTx(tx: Prisma.TransactionClient, token: RefreshToken): Promise<boolean> {

  // modifie un token identifié par son id et consumed est false
  const updated = await tx.refreshToken.updateMany({
    where: {
      id: token.id,
      consumed: false
    },
    data: {
      consumed: true,
    }
  });

  // retourne vrai si le nombre de token modifié est 1
  return updated.count == 1;
}


// --------------------------------
// calcul le hash du refresh token
// --------------------------------
export function getTokenHash(token: string): string {
  // ici, pour des refresh token on utilise l'algorithme sha512
  // l'algorithme est rapide et déterministe : une même source porduit toujours le même hash
  // sauf que : les token sont des strings aléatoires de 256 octects et renouvelés très régulièrement
  // la taille des token + leur valeur aléatoire + leur courte durée de vie rend impossible l'exploitation des hash s'ils sont volés
  // un attanquant ne pas essayer par brut force toutes les combinaisons possible de token
  // FIXME cette constatation est valable en 2026
  return crypto.createHash("sha512").update(token).digest("hex");
}