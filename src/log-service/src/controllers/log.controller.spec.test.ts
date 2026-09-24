import type { AxiosInstance } from "axios";
import assert from "node:assert";
import { randomUUID } from "node:crypto";
import { beforeEach, describe, it } from "node:test";
import * as libTests from "../../test/index.ts";

describe("logs.controller", () => {

  const requester: AxiosInstance = libTests.requester;

  beforeEach(async () => {
    // do nothing
  });

  describe("[POST] /api/logs", () => {

    it("should save one log and provide it", async () => {

      // Un nom de service unique pour isoler les logs insérés des autres logs testés
      const service = `filter-test-${randomUUID()}`;

      // insert log      
      const log = {
        level: "warn",
        message: "Hello world!",
        service,
      };

      let response = await requester.post('/logs', log);

      // assert log inserted
      assert.strictEqual(response.status, 200, JSON.stringify(response.data));
      assert.ok(response.data._id, JSON.stringify(response.data));

      // serach log
      const id = response.data._id;
      response = await requester.get(`/logs/${id}`);

      // assert log exists into response
      assert.strictEqual(response.status, 200, JSON.stringify(response.data));
      assert.ok(response.data._id, JSON.stringify(response.data));
      assert.strictEqual(response.data.message, log.message, JSON.stringify(response.data));
    });
  });
});