import assert from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { prisma } from "../models/index.ts";
// lib test pour faciliter les test
import { AxiosInstance } from "axios";
import { Tag } from "../../generated/prisma/client.ts";
import * as libTests from '../../test/index.ts';
// lib tokens pour manipuler les tokens

describe("tags.controller", () => {
  let aliceRequester: AxiosInstance;

  beforeEach(async () => {
    aliceRequester = await libTests.loggedRequester(libTests.ALICE);
  });

  describe("[GET] /api/tags", () => {
    it("should return all tags from the database", async () => {
      const databaseTags = await prisma.tag.createManyAndReturn({
        data: [
          { name: "Tag 1", authorId: libTests.ALICE.id },
          { name: "Tag 2", authorId: libTests.ALICE.id },
        ]
      });

      const response = await aliceRequester.get("/tags");

      assert.equal(response.status, 200, response.data);

      const tags = response.data;

      assert.equal(tags.length, databaseTags.length, tags);
    });

    it("should return an empty array when there are no tags in the database", async () => {
      const { data: tags } = await aliceRequester.get("/tags");

      assert.deepStrictEqual(tags, []);
    });

    describe("parameters: limit", () => {
      it("should return the limited number of tags", async () => {
        const databaseTags = await prisma.tag.createManyAndReturn({
          data: [
            { name: "Tag 1", authorId: libTests.ALICE.id },
            { name: "Tag 2", authorId: libTests.ALICE.id },
            { name: "Tag 3", authorId: libTests.ALICE.id },
          ]
        });
        const LIMIT = 2;

        const { data: tags } = await aliceRequester.get(`/tags?limit=${LIMIT}`);

        assert.equal(tags.length, LIMIT);
        assert.deepStrictEqual(tags[0].name, databaseTags[0].name);
      });
    });

    describe("parameters: page", () => {
      it("should return the tags from page the requested page", async () => {
        await generateMultipleTags(25);
        const PAGE = 2;

        const { data: tags } = await aliceRequester.get(`/tags?page=${PAGE}`);

        assert.equal(tags.length, 5); // 20 tags par page par défaut => 5 tags restant pour la page 2
      });
    });

    describe("parameters: authorId", () => {
      it("should only return the tags from the requested user", async () => {

        await libTests.register(libTests.BOB);
        await libTests.logUser(libTests.BOB);

        await prisma.tag.create({ data: { name: "Tag from user 1", authorId: libTests.ALICE.id } });
        await prisma.tag.create({ data: { name: "Tag from user 2", authorId: libTests.BOB.id } });

        const { data: tags } = await aliceRequester.get(`/tags?authorId=${libTests.ALICE.id}`);

        assert.equal(tags.length, 1);
        assert.equal(tags[0].name, "Tag from user 1");
      });
    });

    describe("parameters: order", () => {
      it("should only tags in alphabetic order", async () => {
        await prisma.tag.create({ data: { name: "B", authorId: libTests.ALICE.id } });
        await prisma.tag.create({ data: { name: "C", authorId: libTests.ALICE.id } });
        await prisma.tag.create({ data: { name: "A", authorId: libTests.ALICE.id } });

        const { data: tags } = await aliceRequester.get(`/tags?order=name:asc`);

        const tagNames = tags.map((tag: any) => tag.name);
        assert.deepStrictEqual(tagNames, ["A", "B", "C"]);
      });
    });


    async function generateMultipleTags(N: number, tag?: Partial<Tag>) {
      const tags: Tag[] = [];

      for (let i = 1; i <= N; i++) {
        const iTag = await prisma.tag.create({
          data: {
            name: `Tag n°${i}`,
            authorId: libTests.ALICE.id,
            ...tag
          }
        });
        tags.push(iTag);
      }

      return tags;
    }
  });

  describe("[GET] /api/tags/:id", () => {
    it("should return the requested tag with all basic properties", async () => {
      const databaseTag = await prisma.tag.create({
        data: {
          name: "Mon tag", authorId: libTests.ALICE.id
        }
      });

      const { data: tag } = await aliceRequester.get(`/tags/${databaseTag.id}`);

      assert.partialDeepStrictEqual(tag, {
        id: databaseTag.id,
        name: databaseTag.name,
        createdAt: databaseTag.createdAt.toISOString(),
        updatedAt: databaseTag.updatedAt.toISOString(),
      });
    });

    it("should return the requested with optional and associated properties", async () => {
      const databaseTag = await prisma.tag.create({
        data: {
          name: "Mon tag",
          authorId: libTests.ALICE.id,
          color: "#F0F",
        }
      });

      const { data: tag } = await aliceRequester.get(`/tags/${databaseTag.id}`);

      assert.partialDeepStrictEqual(tag, {
        id: databaseTag.id,
        name: databaseTag.name,
        color: databaseTag.color,
        authorId: libTests.ALICE.id,
        author: {
          id: libTests.ALICE.id,
          firstname: libTests.ALICE.firstname,
          lastname: libTests.ALICE.lastname
        }
      });
    });

    it("should return the whole tag hierarchy", async () => {
      const devTag = await prisma.tag.create({
        data: {
          name: "Web dev",
          authorId: libTests.ALICE.id,
        }
      });
      const frontTag = await prisma.tag.create({
        data: {
          name: "Frontend",
          authorId: libTests.ALICE.id,
          parentTagId: devTag.id
        }
      });
      const reactTag = await prisma.tag.create({
        data: {
          name: "React",
          authorId: libTests.ALICE.id,
          parentTagId: frontTag.id
        }
      });
      const svelteTag = await prisma.tag.create({
        data: {
          name: "Svelte",
          authorId: libTests.ALICE.id,
          parentTagId: frontTag.id
        }
      });

      const { data: tag } = await aliceRequester.get(`/tags/${frontTag.id}`);

      assert.partialDeepStrictEqual(tag, {
        id: frontTag.id,
        name: frontTag.name,
        parentTagId: devTag.id,
        parentTag: {
          id: devTag.id,
          name: devTag.name
        },
        childrenTags: [
          { id: reactTag.id, name: reactTag.name },
          { id: svelteTag.id, name: svelteTag.name },
        ]
      });
    });

    it("should return a 404 when the requested tag does not exist", async () => {
      const UNEXISTING_ID = 42;

      const { status } = await aliceRequester.get(`/tags/${UNEXISTING_ID}`);

      assert.equal(status, 404);
    });
  });

  describe("[POST] /api/tags", () => {
    it("should create a tag with the minimum properties", async () => {
      const TAG = { name: "Tag name" };

      const { status, data: tag } = await aliceRequester.post("/tags", TAG);

      assert.equal(status, 201);
      assert.ok(tag.id);
      assert.ok(tag.createdAt);
      assert.ok(tag.updatedAt);
      assert.equal(tag.name, TAG.name);
      assert.equal(tag.authorId, libTests.ALICE.id);
    });

    it("should create a tag with a color", async () => {
      const TAG = { name: "Tag name", color: "#F0F" };

      const { data: tag } = await aliceRequester.post("/tags", TAG);

      assert.equal(tag.color, TAG.color);
    });

    it("should create a tag that is connected to a parent tag", async () => {
      const parentTag = await prisma.tag.create({ data: { name: "Sport", authorId: libTests.ALICE.id } });
      const CHILD_TAG = { name: "Tennis", parentTagId: parentTag.id };

      const { data: childTag } = await aliceRequester.post("/tags", CHILD_TAG);

      assert.equal(childTag.parentTagId, parentTag.id);
    });

    it("should reject the request if the name is already taken", async () => {
      const TAKEN_NAME = "Sport";
      await prisma.tag.create({ data: { name: TAKEN_NAME, authorId: libTests.ALICE.id } });

      const { status } = await aliceRequester.post("/tags", { name: TAKEN_NAME });

      assert.equal(status, 409);
    });

    it("should reject the request if the provided parent tag does not exist", async () => {
      const TAG = { name: "Tag avec un parent qui n'existe pas", parentTagId: 42 };

      const { status } = await aliceRequester.post("/tags", TAG);

      assert.equal(status, 404);
    });
  });

  describe("[PATCH] /api/tags/:id", () => {
    let tagToUpdate: Tag;

    beforeEach(async () => {
      tagToUpdate = await prisma.tag.create({
        data: {
          name: "Tag à mettre à jour",
          authorId: libTests.ALICE.id
        }
      });
    });

    it("should return the updated tag", async () => {
      const NEW_NAME = "Nouveau nom du tag";

      const { status, data: tag } = await aliceRequester.patch(`/tags/${tagToUpdate.id}`, { name: NEW_NAME });

      assert.equal(status, 200);
      assert.equal(tag.name, NEW_NAME);
    });

    it("should effectively update the tag in database", async () => {
      const NEW_NAME = "Nouveau nom du tag";

      await aliceRequester.patch(`/tags/${tagToUpdate.id}`, { name: NEW_NAME });

      const updatedTag = await prisma.tag.findUniqueOrThrow({ where: { id: tagToUpdate.id } });
      assert.equal(updatedTag.name, NEW_NAME);
    });

    it("should update the color", async () => {
      const NEW_COLOR = "#F0F";

      const { status, data: tag } = await aliceRequester.patch(`/tags/${tagToUpdate.id}`, { color: NEW_COLOR });

      assert.equal(status, 200);
      assert.equal(tag.color, NEW_COLOR);

      const updatedTag = await prisma.tag.findUniqueOrThrow({ where: { id: tagToUpdate.id } });
      assert.equal(updatedTag.color, NEW_COLOR);
    });

    it("should update the parent tag", async () => {
      // TODO
    });

    it("should unset the color when null is provided", async () => {
      // TODO
    });

    it("should unset the parent tag when null is provided", async () => {
      // TODO
    });

    it("should return a 409 when the new name is already taken", async () => {
      // TODO
    });

    it("should return a 404 when the new parent tag does not exist in the database", async () => {
      // TODO
    });

    it("should return a 403 when the author is not the creator of the tag", async () => {
      // TODO
    });
  });

  describe("[DELETE] /api/tags/:id", () => {
    it("should delete the tags from the database", async () => {
      const tag = await prisma.tag.create({ data: { name: "Niveau à supprimer", authorId: libTests.ALICE.id } });

      const { status } = await aliceRequester.delete(`/tags/${tag.id}`);

      assert.equal(status, 204);
      const remainingNumberOfTags = await prisma.tag.count();
      assert.equal(remainingNumberOfTags, 0);
    });

    it("should delete the tag if the requester is an author that created the tag", async () => {
      const tag = await prisma.tag.create({ data: { name: "Niveau à supprimer", authorId: libTests.ALICE.id } });

      const { status } = await aliceRequester.delete(`/tags/${tag.id}`);

      assert.equal(status, 204);
    });

    it("should return a 403 when the requester is an author that is NOT the creator of the tag", async () => {

      // Alice crée un tag
      const tag = await prisma.tag.create({ data: { name: "Niveau à supprimer", authorId: libTests.ALICE.id } });

      // Bob essaye de supprime le tag
      const bobRequester = await libTests.loggedRequester(libTests.BOB);
      const { status } = await bobRequester.delete(`/tags/${tag.id}`);

      // 403 unauthorized
      assert.equal(status, 403);
    });

    it("should return a 404 when the tag to delete does not exist", async () => {
      const UNEXISTING_TAG_ID = 42;

      const { status } = await aliceRequester.delete(`/tags/${UNEXISTING_TAG_ID}`);

      assert.equal(status, 404);
    });
  });
});
