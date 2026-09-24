import axios from "axios";

// configurer axios pour envoyer des requêtes vers l'API
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

// axios requeter (objet axios qui va envoyer les requêtes)
export const requester = axios.create({
  baseURL: apiBaseUrl,
  validateStatus: () => true,
  withCredentials: true, // envoi les cookies dans l'entête les requetes ! 
})

export function toReadableDate(date: Date) {
  return date.toLocaleDateString("fr-FR", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});
}
