import type { AxiosResponse } from "axios";
import { requester } from "../lib/utils";
import { api } from "./api";

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const securedApi = {
  getUsers: getUsers
};


// --------------------------------
// Secured API permet d'envoyer des requêtes métier (GET /users, etc) vers l'API de manière « sécurisée »
// Si l'API répond avec une erreur 401, Secured API envoie une requete refresh
// Si le refresh retourne 200 OK, la requête métier initiale est renvoyée
// Secured API garanti que même si plusieurs requêtes métier échouent avec une erreur 401,
// une et une seule requete refresh est envoyée --> elle garanti que l'API n'a pas à traiter plusieurs requete refresh concurentes


// --------------------------------
// une Promise qui contient un bool ou null.
// prend la valeur null pour commencer
let refreshPromise: Promise<boolean> | null = null;

// --------------------------------
// Envois la requete refresh
// --------------------------------
// Fonction avancée qui permet de ne lancer qu'un seul appel de refresh() à la fois
// Protection contre des appels qui pourraient se chevaucher (en même temps) dans un même onglet
// Pour éviter les appels "concurents" de refresh qui pourraient être rejetés par l'API, car le serait token déjà consommé
async function refreshOnce(): Promise<boolean> {

  if (null === refreshPromise) {
    // la promise refreshPromise est nulle
    // pas de refresh en cours, on lance un refresh
    refreshPromise = api.refresh();

    try {
      // await attends le résultat refresh()
      // quand la fonction est terminée, retourne le résultat: un boolean
      return await refreshPromise;
    } finally {
      // refresh() est terminée, réinitialise la promise refreshPromise à null
      refreshPromise = null;
    }
  }

  // retourne la Promise refreshPromise
  // on est en attente de la fin de refresh()
  return refreshPromise;
}


// --------------------------------
// Envois une requete vers l'API avec un refresh si besoin 
// --------------------------------
// withRefresh prend en argument une fonction qui envoie une requete à l'API et retourne une Promise
// withRefresh exécute la fonction. 
// La fonction envoie une requête, si la réponse est 401, 
// withRefresh tente de se reconnecter avec un refresh avant de relancer la requete
async function withRefresh(request: () => Promise<AxiosResponse>): Promise<AxiosResponse> {

  // execute la fonction passée en paramètre
  // la fonction envoie une requete vers l'API
  const response = await request();

  // réponse recue de l'API : 401 unauthorized
  if (401 == response.status) {
    // essaie de se reconnecter automatiquement avec la fonction refreshOnce
    const refreshed = await refreshOnce();
    if (refreshed) {
      // le refresh a fonctionné, on est reconnecté
      // on relance la requete initiale et retourne le résultat de la requete
      return await request();
    }
  }

  // retourne le résultat de la requete initiale dans le cas ou la réponse n'est pas 401
  return response;
}


// --------------------------------
// GET /users with fetch
// --------------------------------
async function getUsers(): Promise<UserDTO[]> {
  // pour garantir une seule requete refresh à la fois
  // requete GET /users envoyée depuis la fonction withRefresh avec une fonction anonyme passée en paramètre
  const response: AxiosResponse = await withRefresh(() => {
    // fonciton anonyme exécutée par withRefresh
    // envoi la requete GET /users vers l'API avec Axios
    // pas de await ici, il est fait automatiquement dans la fonction withRefresh
    // retourne la réponse de la requete --> stockée dans response
    return requester.get('/users');
  });

  // retourne le body de la requete retourné par withRefresh
  return response.data;
}


// --------------------------------
export interface UserDTO {
  id: number;
  firstname: string;
  lastname: string;
  email: string;
}