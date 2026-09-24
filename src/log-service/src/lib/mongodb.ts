// librairie pour se connecter à mongoDB

import { MongoClient } from 'mongodb';
import { config } from '../../config.ts';

let client: MongoClient | null = null;

// fonction pour se connecter à mongo
export async function connect(): Promise<MongoClient> {

  // si client != null --> client est déjà initialisé
  // il faut le retourner
  if(null != client) {
    return client;
  }

  // initialiser client
  client = new MongoClient(config.mongodbUrl);
  await client.connect();
  
  return client;
}


// fonction pour se déconnecter
export async function close(): Promise<void> {
  if(null != client) {
    await client.close();
    client = null;
  }
}