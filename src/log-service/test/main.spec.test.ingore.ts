import "dotenv/config";
import { config } from '../config.ts';

import * as logService from '../src/services/log.service.ts'

import {  describe, it } from "node:test";

describe('Démo create log', () => {

  it('should register one log', async () => {

    // insérer un nouveau doc dans mongo
    // définition du doc à insérer
    const log: logService.LogDocument = {
      // on ne rensigne pas _id --> c'est mongo qui va nous le donner
      data: "Hello world!"
    }

    // appelle le service pour enregistrer le document
    const response = await logService.createLog(log);



    // affiche le document enregistré --> on retrouve data + _id qui a été modifié par mongo
    console.log(JSON.stringify(response));

    const id = response._id;

    if(!id) {
      throw new Error("");
    }

    await logService.getLogById(id.toString());
  });
});
