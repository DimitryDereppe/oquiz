// On importe le test runner
import { beforeEach, describe, it } from "node:test";
// On importe la bibliothèque d'assertion
import assert from "node:assert";
import { AxiosInstance } from "axios";
import * as libTests from '../../test/index.ts';
// On importe prisma pour pouvoir faire les opérations sur la BDD
import { prisma } from "../models/index.ts";

describe("users.controller", () => {
  let aliceRequester: AxiosInstance;

  beforeEach(async () => {
    aliceRequester = await libTests.loggedRequester(libTests.ALICE);
  });

  describe("[GET] /api/users", () => {

    it("should return an array with all the database's users", async () => {
      // Arrange
      // On crée plusieurs utilisateurs en base de donnée et ensuite on les stocks dans la constante databaseUsers
      // On les stocks dans la constante parce que nous pourront comparer avec les résultats obtenu en BDD (Assert)
      // !important, pensez à mettre un await avant vos requetes prisma
      // const databaseUsers = await prisma.user.createManyAndReturn({
      //   data: [
      //     { firstname: "Alice", lastname: "Dupont", email: "alice@example.com", password: "Azerty123!" },
      //     { firstname: "Bob", lastname: "Renault", email: "bob@example.com", password: "Azerty123!" }
      //   ]
      // });

      const databaseUsers = await prisma.user.findMany();

      // Act
      // Avec fetch on appel le serveur de test qui est sur le port 7357 (cf: le .env.test)
      const httpResponse = await aliceRequester.get('/users');
      const body = httpResponse.data;

      // Assert
      // Je prend databaseUsers et je vais la comparer au body pour m'assurer que les données que je rentre BDD
      // sont les mêmes que celles que je récupère
      for (let i = 0; i < body.length; i++) {
        assert.strictEqual(databaseUsers[i].id, body[i].id);
        assert.strictEqual(databaseUsers[i].firstname, body[i].firstname);
        assert.strictEqual(databaseUsers[i].lastname, body[i].lastname);
        assert.strictEqual(databaseUsers[i].email, body[i].email);
        // pour la méthode toISOString() : https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString
        assert.strictEqual(databaseUsers[i].createdAt.toISOString(), body[i].createdAt);
        assert.strictEqual(databaseUsers[i].updatedAt.toISOString(), body[i].updatedAt);
      }

    });

    it("should not return the password", async () => {
      // Arrange
      // await prisma.user.createMany({
      //   data: [
      //     { firstname: "Alice", lastname: "Dupont", email: "alice@example.com", password: "Azerty123!" },
      //     { firstname: "Bob", lastname: "Renault", email: "bob@example.com", password: "Azerty123!" }
      //   ]
      // });

      // Act
      const httpResponse = await aliceRequester.get('/users');
      const body = httpResponse.data;

      // Assert
      assert.strictEqual(body[0].password, undefined);
      // assert.strictEqual(body[1].password, undefined);
    });
  });
});