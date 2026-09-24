import { after, before } from "node:test";
import * as libMongoDB from "../../src/lib/mongodb.ts";
import { config } from "../../config.ts";
import { Server } from "node:http";
import { app } from '../../src/app.ts';

// Serveur HTTP (de test)
let server: Server;

// Hook before : s'exécute une fois avant l'ensemble des tests
before(async () => {

  // On lance un serveur de test
  server = app.listen(process.env.PORT);
});


// fonction appellée autimatiquement à la fin des tests
after(async () => {

  server?.close();

  // supprimer la collection qui a servi aux tests
  // const mongoClient = await libMongoDB.connect();
  // await mongoClient.db().collection(config.mongodbCollection).drop();

  // ferme la connection à la BDD
  await libMongoDB.close();
})
