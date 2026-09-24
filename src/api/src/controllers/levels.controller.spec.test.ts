import { beforeEach, describe, it } from "node:test";
import { prisma } from "../models/index.ts";
import assert from "node:assert";
import { AxiosInstance } from "axios";
import * as libTests from "../../test/index.ts";

describe("levels.controller", () => {
  let aliceRequester: AxiosInstance;

  beforeEach(async () => {
    aliceRequester = await libTests.loggedRequester(libTests.ALICE);
  });

  describe("[GET] /api/levels", () => {

    it("should return an empty array if there is no data on database", async () => {
      // Arrange
      // On a pas besoin de préparer de données puisque l'on veut que le tableau soit vide !

      // Act

      const httpResponse = await aliceRequester.get('/levels');
      const body = httpResponse.data;

      // Assert
      // assert.deepStrictEqual(body, []) - cf voir cours SC02E04
      assert.strictEqual(body.length, 0);
    });

    it("should return 2 levels if there is 2 levels on database", async () => {
      // Arrange
      const levels = await prisma.level.createManyAndReturn({
        data: [
          { name: "facile" },
          { name: "difficile" }
        ]
      });

      // Act
      const httpResponse = await aliceRequester.get('/levels');
      const body = httpResponse.data;

      // Assert
      // La longueur du tableau est bien de 2 même si les positions respective dans le tableau sont 0 et 1
      assert.strictEqual(body.length, 2);
      // On vérifie que les données récupérée sont bien celle que l'on a insérée
      assert.strictEqual(body[0].name, levels[0].name);
      assert.strictEqual(body[1].name, levels[1].name);

    });

    it("should return all properties of levels", async () => {
      // Arrange
      // On crée un seul level, pas besoin d'en créer plus puisque ici on souhaite vérifier que nous avons toutes les propriétés
      await prisma.level.create({
        data: { name: "facile" }
      });

      // Act
      const httpResponse = await aliceRequester.get('/levels');
      const body = httpResponse.data;

      // Assert
      assert.ok(body[0].id);
      assert.ok(body[0].name);
      assert.ok(body[0].createdAt);
      assert.ok(body[0].updatedAt);

    });
  });

  describe("[GET] /api/levels/:id", () => {

    it("should return level with the expected properties (id, name, createdAt, updatedAt)", async () => {
      // Arrange
      // On insère une donnée en BDD
      const level = await prisma.level.create({
        data: { name: "facile" }
      });

      // Act
      // Cette écriture est également possible : const httpResponse = await fetch("http://localhost:7357/api/levels/" + level.id)
      const httpResponse = await aliceRequester.get(`/levels/${level.id}`);
      const body = httpResponse.data;

      // Assert
      // On vérifie que l'on récupère bien les bonnes propriétés
      assert.ok(body.id);
      assert.ok(body.name);
      assert.ok(body.createdAt);
      assert.ok(body.updatedAt);

      // On vérifie que le level ajouté est bien en BDD
      assert.strictEqual(body.name, level.name);

    });

    it("should return a 404 error if the level doesn't exist", async () => {
      // Arrange
      // Nous n'avons rien à faire ici

      // Act
      const httpResponse = await aliceRequester.get(`/levels/999`);

      // Assert
      assert.strictEqual(httpResponse.status, 404);
    });

  });

  describe("[POST] /api/levels", () => {

    it("should create a level in the database", async () => {
      // Arrange
      const body = { name: "mon nouveau level" };

      // Act
      await aliceRequester.post(`/levels`, body);

      // Assert
      const createdLevel = await prisma.level.findFirst({ where: { name: "mon nouveau level" } });
      assert.ok(createdLevel);
      // assert.strictEqual(createdLevel.name, body.name);
    });

    it("should return level with the expected properties (id, name, createdAt, updatedAt)", async () => {
      // Arrange
      const body = { name: "mon nouveau level" };

      // Act
      await aliceRequester.post(`/levels`, body);

      // Assert
      const createdLevel = await prisma.level.findFirst({ where: { name: "mon nouveau level" } });
      assert.ok(createdLevel?.id);
      assert.ok(createdLevel?.name);
      assert.ok(createdLevel?.createdAt);
      assert.ok(createdLevel?.updatedAt);

    });

    it("should return a 422 error if there is no good property", async () => {
      // Arrange
      const body = { names: "mon nouveau level" };

      // Act
      const httpResponse = await aliceRequester.post(`/levels`, body);

      // Assert
      assert.strictEqual(httpResponse.status, 422);

    });

    it("should return a 422 error if the type of the data is not correct", async () => {
      // Arrange
      const body = { name: 122 };

      // Act
      const httpResponse = await aliceRequester.post(`/levels`, body);

      // Assert
      assert.strictEqual(httpResponse.status, 422);

    });

    it("should return a 409 error if there is already a level with the same name in the database", async () => {
      // Arrange
      const body = { name: "facile" };
      await prisma.level.create({ data: { name: "facile" } });

      // Act
      const httpResponse = await aliceRequester.post(`/levels`, body);


      // Assert
      assert.strictEqual(httpResponse.status, 409);

    });

  });

  describe("[PATCH] /api/levels/:id", () => {

    it("should return an updated level with correct properties", async () => {
      // Arrange
      const level = await prisma.level.create({ data: { name: "faciles" } });
      const body = { name: "facile" };

      console.log(level.id);
      // Act
      const httpResponse = await aliceRequester.patch(`/levels/${level.id}`, body);
      const updatedLevel = await httpResponse.data;

      // Assert
      // On vérifie que le level existe
      assert.ok(updatedLevel);

      // On vérifie que les bonnes propriétés sont présente
      assert.ok(updatedLevel.id);
      assert.ok(updatedLevel.name);
      assert.ok(updatedLevel.createdAt);
      assert.ok(updatedLevel.updatedAt);

    });

    it("should return a 404 error if the level doesn't exist", async () => {
      // Arrange
      const body = { name: "facile" };

      // Act
      const httpResponse = await aliceRequester.patch(`/levels/999`, body);

      // Assert
      assert.strictEqual(httpResponse.status, 404);
    });

    it("should return a 422 error if there is no good property", async () => {
      // Arrange
      const level = await prisma.level.create({ data: { name: "facile" } });
      const body = { names: "mon nouveau level" };

      // Act
      const httpResponse = await aliceRequester.patch(`/levels/${level.id}`, body);

      // Assert
      assert.strictEqual(httpResponse.status, 422);

    });

    it("should return a 422 error if the type of the data is not correct", async () => {
      // Arrange
      const level = await prisma.level.create({ data: { name: "facile" } });
      const body = { name: 122 };

      // Act
      const httpResponse = await aliceRequester.patch(`/levels/${level.id}`, body);

      // Assert
      assert.strictEqual(httpResponse.status, 422);

    });

    it("should return a 409 error if there is already a level with the same name in the database", async () => {
      // Arrange
      // Ici on crée 2 valeur en BDD, une qui va servir à être modifiée et l'autre qui servira de valeur pour éviter le doublon et déclencher l'erreur
      const body = { name: "facile" };
      await prisma.level.create({ data: { name: "facile" } });
      const level = await prisma.level.create({ data: { name: "difficile" } });

      // Act
      const httpResponse = await aliceRequester.patch(`/levels/${level.id}`, body);

      // Assert
      assert.strictEqual(httpResponse.status, 409);

    });

  });

  describe("[DELETE] /api/levels/:id", () => {
    it("should delete the selected level throw a 204", async () => {
      // Arrange
      // Je crée un niveau
      const level = await prisma.level.create({ data: { name: "difficile" } });

      // Act
      // Je tente de supprimer ce niveau
      const httpResponse = await aliceRequester.delete(`/levels/${level.id}`);

      // J'utilise prisma pour m'assurer que mon level a bien disparu de la BDD
      // C'est pour confirmer que la route a bien fait son travail
      const element = await prisma.level.findUnique({
        where: { id: level.id }
      });

      // Assert
      assert.strictEqual(element, null);
      assert.strictEqual(httpResponse.status, 204);

    });

    it("should throw a 404 error if level doesn't exist", async () => {
      // Arrange
      // Inutile de créer un level

      // Act 
      const httpResponse = await aliceRequester.delete(`/levels/999`);

      // Assert
      // On va vérifier que la réponse à bien un statut 404
      assert.strictEqual(httpResponse.status, 404);
    });
  });
});