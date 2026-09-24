// On importe le test runner
import { describe, it } from "node:test";
// On importe la bibliothèque d'assertion
import assert from "node:assert";
// On importe prisma pour pouvoir faire les opérations sur la BDD
import { prisma } from "../models/index.ts";
// lib test pour faciliter les test
import * as libTests from '../../test/index.ts';
// lib tokens pour manipuler les tokens
import { ACCESS_COOKIE, REFRESH_COOKIE } from "../lib/tokens.ts";


// =========================
// ** POST /auth/register **
// =========================

// --------------------------------
describe("tag.controller", () => {

  describe("[POST] /auth/register", () => {

    // ===
    // Register Alice OK
    // ===

    it("should respond 201 CREATED", async () => {

      // envois une requete POST /auth/register avec axios
      const response = await libTests.requester.post('/auth/register', libTests.ALICE);

      // body de la réponse
      const bodyReponse = response.data;

      // test code reponse 201 CREATED
      assert.strictEqual(response.status, 201, JSON.stringify(bodyReponse));

      // test body de la réponse
      assert.ok(bodyReponse.id);
      assert.ok(bodyReponse.createdAt);
      assert.ok(bodyReponse.updatedAt);
      assert.strictEqual(bodyReponse.firstname, libTests.ALICE.firstname);
      assert.strictEqual(bodyReponse.lastname, libTests.ALICE.lastname);
      assert.strictEqual(bodyReponse.email, libTests.ALICE.email);

      // test que le password n'est pas dans le body de la réponse
      assert.ok(!bodyReponse.password);
      assert.ok(!bodyReponse.confirm);

      // l'utilisateur est bien enregistré dans la BDD ?
      const alice = await prisma.user.findFirst({ where: { email: libTests.ALICE.email } });
      assert.ok(alice);
      assert.strictEqual(alice.firstname, libTests.ALICE.firstname);
      assert.strictEqual(alice.lastname, libTests.ALICE.lastname);
      assert.strictEqual(alice.email, libTests.ALICE.email);
      // le mot de passe commence bien par "argon2id" ?
      assert.match(alice.password, /\$argon2id/);

    });

    // ===
    // Register Alice twice KO
    // ===

    it("should not register Alice twice", async () => {
      // enregistre Alice dans la BDD une première fois
      await libTests.requester.post("/auth/register", libTests.ALICE);

      // enregistre Alice une deuxième fois 
      const response = await libTests.requester.post("/auth/register", libTests.ALICE);
      // HTTP response code 409 CONFLICT
      assert.strictEqual(response.status, 409, JSON.stringify(response.data));
      // vérifie si Alice est une seule fois dans la BDD
      assert.strictEqual(await prisma.user.count({ where: { email: libTests.ALICE.email } }), 1,);
    });

    // ===
    // Register malformed user OK
    // ===

    it("should not register malformed user in database", async () => {
      // firstname invalid
      let response = await libTests.requester.post("/auth/register", {
        firstname: "",
        lastname: "DOE",
        email: "another@oquiz.test",
        password: "Password!1234",
        confirm: "Password!1234",
      });
      assert.strictEqual(response.status, 400, JSON.stringify(response.data));

      // lastname invalid
      response = await libTests.requester.post("/auth/register", {
        firstname: "alice",
        lastname: "",
        email: "another@oquiz.test",
        password: "Password!1234",
        confirm: "Password!1234",
      });
      assert.strictEqual(response.status, 400, JSON.stringify(response.data));

      // email invalid
      response = await libTests.requester.post("/auth/register", {
        firstname: "alice",
        lastname: "DOE",
        email: "my email",
        password: "Password!1234",
        confirm: "Password!1234",
      });
      assert.strictEqual(response.status, 400, JSON.stringify(response.data));

      // password too weak
      response = await libTests.requester.post("/auth/register", {
        firstname: "alice",
        lastname: "DOE",
        email: "another@oquiz.test",
        password: "password",
        confirm: "password",
      });
      assert.strictEqual(response.status, 400, JSON.stringify(response.data));

      // password different
      response = await libTests.requester.post("/auth/register", {
        firstname: "alice",
        lastname: "DOE",
        email: "another@oquiz.test",
        password: "Password!1234",
        confirm: "not the same",
      });
      assert.strictEqual(response.status, 400, JSON.stringify(response.data));
    });
  });


  // ======================
  // ** POST /auth/login **
  // ======================

  // --------------------------------
  describe("[POST] /auth/login", () => {

    it("should respond 200", async () => {

      // données du formulaire de connexion : uniquement le login et le mot de passe
      const loginAlice = {
        email: libTests.ALICE.email,
        password: libTests.ALICE.password,
      };

      // FIXME : utiliser un before OU prisma pour enregistrerlibTests.ALICE dans la BDD
      // requete POST /register pour enregistrerlibTests.ALICE dans la BDD avant de tester le login (quick and dirty)
      await libTests.requester.post('/auth/register', libTests.ALICE);

      // envois une requete POST /auth/login avec axios
      const response = await libTests.requester.post('/auth/login', loginAlice);

      // body de la réponse
      const bodyReponse = response.data;

      // test code reponse 200 OK
      assert.strictEqual(response.status, 200, JSON.stringify(bodyReponse));

      // test access token existe dans la réponse
      const accessToken = libTests.getTokenFromResponse(response, ACCESS_COOKIE.name);
      assert.ok(accessToken, "access token n'existe pas");

      // test refreshCookie existe dans la réponse
      const refreshToken = libTests.getTokenFromResponse(response, REFRESH_COOKIE.name);
      assert.ok(refreshToken, "refresh token n'existe pas");

      // TODO tester les options enregistrées dans les cookies --> des expressions régulières en masse !
      // TODO tester si l'access token (JWT) est valide + vérifier le contenu de sa payload
      // TODO tester si le refresh token est bien enregistré dans la BDD
    });
  });


  // ==================
  // ** GET /auth/me **
  // ==================

  // --------------------------------
  describe("[GET] /api/auth/me", () => {

    it("should returnlibTests.ALICE's info", async () => {

      const aliceRequester = await libTests.loggedRequester(libTests.ALICE);

      // requête GET /auth/me avec l'access cookie
      const response = await aliceRequester.get("/auth/me");

      // compare le body de la réponse avec les données de test
      assert.strictEqual(response.status, 200, JSON.stringify(response.data));
      assert.strictEqual(response.data.firstname, libTests.ALICE.firstname);
      assert.strictEqual(response.data.lastname, libTests.ALICE.lastname);
      assert.strictEqual(response.data.email, libTests.ALICE.email);
      assert.ok(!response.data.password, "La réponse ne doit pas contenir le champ password");
    });
  });


  // =======================
  // ** POST /auth/logout **
  // =======================

  // --------------------------------
  describe("[POST] /api/auth/logout", () => {

    it("Should logout user", async () => {

      await libTests.register(libTests.ALICE);
      const loginCookies = await libTests.logUser(libTests.ALICE);

      // logout sans accessToken --> attendu 401
      let response = await libTests.requester.post("/auth/logout", { /* body vide */ }, {});
      assert.strictEqual(response.status, 401, JSON.stringify(response.data));

      // logout avec l'access token --> 204
      response = await libTests.requester.post("/auth/logout", { /* body vide */ }, {
        headers: { // injecte l'accessCookie dans l'entête de la requete 
          Cookie: loginCookies.accessCookie, // accessToken=<token value> 
        }
      });
      assert.strictEqual(response.status, 204, JSON.stringify(response.data));

      // extrait les token de la réponse
      const newAccessToken = libTests.getTokenFromResponse(response, ACCESS_COOKIE.name);
      const newRefreshToken = libTests.getTokenFromResponse(response, REFRESH_COOKIE.name);

      // les cookies sont vide
      assert.ok(!newAccessToken, "Nouveau access token existe");
      assert.ok(!newRefreshToken, "Nouveau refresh token existe");

      // TODO tester si le refresh token sont bien tous consommés dans la BDD
    });
  });


  // =============
  // ** REFRESH **
  // =============

  // --------------------------------
  describe("[POST] /api/auth/refresh", () => {

    it("Should refresh tokens", async () => {

      await libTests.register(libTests.ALICE);
      const loginCookies = await libTests.logUser(libTests.ALICE);

      // Act
      let response = await libTests.requester.post("/auth/refresh", { /* body vide */ }, {
        headers: { // injecte le refresh Cookie dans l'entête de la requete 
          Cookie: loginCookies.refreshCookie,
        }
      });
      const newAccessCookie = libTests.findCookieFromResponse(response, ACCESS_COOKIE.name);
      const newRefreshCookie = libTests.findCookieFromResponse(response, ACCESS_COOKIE.name);

      // Assert
      assert.strictEqual(response.status, 200, JSON.stringify(response.data));
      assert.ok(newAccessCookie, "Nouveau access token est manquant");
      assert.ok(newRefreshCookie, "Nouveau refresh token est manquant");
      assert.notEqual(loginCookies.refreshCookie, newRefreshCookie, "Nouveau refresh token est identique a l'ancien");

      // TODO vérifier que le nouveau refresh token existe bien dans la BDD et est valide (non consommé)

      // tester une demande de refresh avec l'ancien token
      response = await libTests.requester.post("/auth/refresh", { /* body vide */ }, {
        headers: { // injecte le refresh Cookie dans l'entête de la requete 
          Cookie: loginCookies.refreshCookie,
        }
      });
      assert.strictEqual(response.status, 401, JSON.stringify(response.data));

      // TODO vérifier que le nouveau refresh token existe bien dans la BDD et est invalide (consommé)

      // tester une demande de refresh avec le nouveau refresh token
      response = await libTests.requester.post("/auth/refresh", { /* body vide */ }, {
        headers: {
          Cookie: newRefreshCookie
        }
      });
      assert.strictEqual(response.status, 401, JSON.stringify(response.data));

      // TODO tester les cas suivants (compliqués à mettre en œuvre) :
      // - deux requêtes simultanées --> une seule doit réussir
      // - la création du token échoue --> rollback de la BDD et ancien token toujours utilisable
      // - un token expiré est refusé 

    });
  });

  // TODO tester les roles
  // * membre peut accéder aux routes membre, mais pas aux autres routes
  // * author peut accéder aux routes memebre + author, mais pas aux routes admin
  // * admin peut accéder à toutes les routes
  // faire les tests avec quelques routes - dans l'idéal, toutes les routes devraient être testées

});
