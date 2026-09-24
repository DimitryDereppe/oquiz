// import du .env pour le numéro de port
import "dotenv/config";
import axios, { AxiosResponse, AxiosInstance } from 'axios';
import { config } from "../config.ts";
import { Role } from '../generated/prisma/enums.ts';
import argon2 from 'argon2';
import { prisma } from '../src/models/index.ts';
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../src/lib/tokens.ts";


export const apiBaseUrl = `http://localhost:${config.port}/api/`;

// Axios requester -> objet axios pour envoyer mes requetes de test
export const requester: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  validateStatus: () => true // résoult les Promise de réponse des requetes
});


// --------------------------------
// définition d'un utilisateur de test
export interface TestUser {
  id: number,
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirm: string;
  role: Role;
}

// --------------------------------
// définition de Alice : admin
export const ALICE: TestUser = {
  id: 0,
  firstname: "Alice",
  lastname: "DOE",
  email: "alice@oquiz.test",
  password: "Password!1234",
  confirm: "Password!1234",
  role: Role.admin,
};


// --------------------------------
// définition de Bob : author
export const BOB: TestUser = {
  id: 0,
  firstname: "Bob",
  lastname: "DOE",
  email: "bob@oquiz.test",
  password: "Password!1234",
  confirm: "Password!1234",
  role: Role.author,
};


// --------------------------------
// définition de CHARLY : member
export const CHARLY: TestUser = {
  id: 0,
  firstname: "Charly",
  lastname: "DOE",
  email: "charly@oquiz.test",
  password: "Password!1234",
  confirm: "Password!1234",
  role: Role.member,
};


// --------------------------------
// cookies issues du login
export interface LogginCookies {
  accessCookie: string;
  refreshCookie: string;
}


// --------------------------------
// crée un utilisateur dans la BDD + log l'utilisateur et retourne son access cookies et refresh cookie
// --------------------------------
export async function register(user: TestUser) {
  // calcul du hash du mot de passe
  const hashedPassword = await argon2.hash(user.password);

  // registre le nouvel utilisateur dans la BDD
  const newUser = await prisma.user.create({
    data: {
      firstname: user.firstname,
      lastname: user.lastname,
      email: user.email,
      password: hashedPassword,
      role: user.role,
    },
  });

  if (!newUser) {
    throw new Error("Failed to create user");
  }

  // update user id
  user.id = newUser.id;
}


// --------------------------------
// connecte un utilisateur et retourne son access cookies et son refresh cookie
// --------------------------------
export async function logUser(user: TestUser): Promise<LogginCookies> {

  // requete login
  const response = await requester.post("/auth/login", { email: user.email, password: user.password });

  if (response.status != 200) {
    console.error(response.status);
    console.error(response.data);
    throw new Error("Failed to create and register user");
  }

  // extrait les cookies de la réponse
  const accessCookie: string = findCookieFromResponse(response, ACCESS_COOKIE.name);
  const refreshCookie: string = findCookieFromResponse(response, REFRESH_COOKIE.name);

  // retourne les cookies de login
  return { accessCookie, refreshCookie };
}


// --------------------------------
// crée une AxiosInstance (pour envoyer des requêtes de test) avec les cookies de login d'un utilisateur
// --------------------------------
export async function loggedRequester(user: TestUser): Promise<AxiosInstance> {

  await register(user);

  const loginCookies: LogginCookies = await logUser(user);

  // Conserver uniquement "nom=valeur", sans les options.
  const accessCookie = loginCookies.accessCookie.split(";")[0];
  const refreshCookie = loginCookies.refreshCookie.split(";")[0];

  if (!accessCookie || !refreshCookie) {
    throw new Error("Cookies de connexion manquants");
  }

  const userRequester: AxiosInstance = axios.create({
    baseURL: apiBaseUrl,
    validateStatus: () => true, // résoult les Promise de réponse des requetes
    headers: {
      // injecte automatiquement les cookies dans toutes les futures requetes
      Cookie: `${accessCookie}; ${refreshCookie}`,
    }
  });

  return userRequester;
}


// ===========
// ** UTILS **
// ===========


// --------------------------------
// Exemple de cookies présents dans une réponse HTTP (dans l'entête de la réponse, tout est sur une seule ligne de texte) : 
// set-cookie: 
//     accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc4OTQ0NzA1OCwiZXhwIjoxNzg5NDUwNjU4fQ.4LFbtgj6USp-xa6xAqGgX4FZsDKMxA_FdazNvhCwImc; 
//                 Max-Age=3600; Path=/; Expires=Tue, 15 Sep 2026 05:37:38 GMT; HttpOnly; Secure; SameSite=None, 
//     refreshToken=VoCM%2B8oGBjkrpNSXduyUyINytUDT6gwUTywyYZNAjzfkY5r2feuFQ%2By4MWJWoKyxFJpd0e6YxKowrpey%2BU34OvgTxdmOZDRIOYEdFdTwDxLWH2tLWHXm%2F3KC%2FJSrue5TAidakZCWKnaTcYO4KgHTYPzjCrOoBU%2Bq0P2pEHTOI7rRnnYHYFIY0xDmtHND8dkGKTFLbaZ6rRxlzgPTUMSHkdOCI3NkNR2AsUuXr%2FyMTsm6LVYf6SUoTRvpLYznqFD6KLRpdF3meI8G20mu%2BWvUZ3G5IfWbxCs7y6xl4X2uW75nKngb%2BVxx2NXabqo6BHj3mBFGuhBz52BgbpmI5Z1R7Q%3D%3D; 
//                  Max-Age=604800; Path=/api/auth/refresh; Expires=Tue, 22 Sep 2026 04:37:38 GMT; HttpOnly; Secure; SameSite=None
// --------------------------------
export function findCookieFromResponse(res: AxiosResponse, tokenName: string): string {
  // récupère tous les cookies de la réponse sous forme de tableau ou un tableau vide
  // chaque case du tableau contient un cookie : un string "<nom>=<valeur>; <options>"
  const cookies: Array<string> = res.headers['set-cookie'] ?? [];

  // retourne tout le cookie : "<nom>=<valeur>; <options>" ou un string vide
  return cookies.find(cookie => cookie.startsWith(`${tokenName}=`)) ?? "";
}


// --------------------------------
// extraire le token du contenu d'un cookie
// --------------------------------
export function extractTokenFromCookie(cookie: string, tokenName: string): string {

  const regex = new RegExp(`^${tokenName}=([^;]+)(?:;|$)`); // regexp pour extraire le token du cookie
  const encodedToken = cookie.match(regex)?.[1] ?? ""; // extaction du token, retourne string vide si pas trouvé

  return decodeURIComponent(encodedToken); // les caractères spéciaux comme +, / et = peuvent devenir %2B, %2F et %3D dans le cookie, il faut les décoder avant de retourner le résultat
}

// --------------------------------
// recherche un cookie d'une réponse Axios
// --------------------------------
export function getTokenFromResponse(res: AxiosResponse, tokenName: string): string {

  const cookie: string = findCookieFromResponse(res, tokenName);

  const token: string = extractTokenFromCookie(cookie, tokenName);

  return token;
}