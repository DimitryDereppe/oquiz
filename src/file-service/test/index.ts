// import du .env pour le numéro de port
import "dotenv/config";
import axios, { type AxiosInstance, type AxiosResponse } from 'axios';
import { config } from "../config.ts";

export const apiBaseUrl = `http://localhost:${config.port}/api/`;

// Axios requester -> objet axios pour envoyer mes requetes de test
export const requester: AxiosInstance = axios.create({
  baseURL: apiBaseUrl,
  validateStatus: () => true // résoult les Promise de réponse des requetes
});
