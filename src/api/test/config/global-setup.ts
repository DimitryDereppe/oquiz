import { execSync } from "node:child_process";
import type { Server } from "node:http";
import { after, before, beforeEach, type TestContext } from "node:test";
import { setTimeout as delay } from "node:timers/promises";
import { app } from "../../src/app.ts";
import { prisma } from "../../src/models/index.ts";

// ================================================================================
// Objectif de ce fichier : mettre en place l'environnement des tests d'intégration

// === AVANT le lancement des tests ===
// Création d'une BDD de test (oquiztest)
// Chargement des variables d'environnement (.env.test) à l'aide du flag --env-file
// Création des tables dans la BDD de test (run les migrations)
// Lacement du serveur Express

// === Entre chaque test ===
// On vide les tables 

// === APRES les tests ===
// Deconnexion du client BDD Prisma
// Arrêt du serveur serveur Express de test
// Supression de la BDD de test
// ================================================================================


// Serveur HTTP (de test)
let server: Server;

// Hook before : s'exécute une fois avant l'ensemble des tests
before(async () => {

  // (Hack) S'assurer que la BDD de test a bien été supprimé
  execSync(`docker rm -f oquiztest 2>/dev/null || true`); 
  
  // Créer un conteneur BDD dédié aux tests
  execSync(`
    docker run \
    -d \
    --name oquiztest \
    -p ${process.env.POSTGRES_PORT}:5432 \
    -e POSTGRES_USER=${process.env.POSTGRES_USER} \
    -e POSTGRES_PASSWORD=${process.env.POSTGRES_PASSWORD} \
    -e POSTGRES_DB=${process.env.POSTGRES_DB} \
    postgres:17 
  `);

  // Vérifier que PostgreSQL répond avant de lancer les migrations.
  await waitForDatabase();

  // Lancer les migrations sur la BDD de test
  // Note : les variables d'environnement (chargés via --env-file flag) sont passé au child process (execSync) par héritage 
  execSync(`npx prisma migrate deploy`);

  // On lance un serveur de test
  server = app.listen(process.env.PORT);
});


// Hook beforeEach : s'exécute une fois avant chaque test
beforeEach(async (t) => {
  (t as TestContext).mock.method(console, "info", () => {});

  await truncateTables();
});


// Hook after : s'exécute une fois après l'ensemble des tests
after(async () => {
  // On éteint le serveur HTTP
  server?.close();

  // On deconnecte la connexion à la BDD
  await prisma.$disconnect();

  // On éteint la base de données de test
  execSync(`docker rm -f oquiztest`);
});


// essaye 10 fois de se connecter à la BDD (1 fois par seconde)
// si une connexion répond, on continue
// si toutes les tentatives de connexion ont échoué -> lance une erreur
async function waitForDatabase() {
  const maxAttempts = 10;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // Cette requête ne nécessite aucune table : les migrations viennent ensuite.
      await prisma.$queryRaw`SELECT 1`;
      return;
    } catch (error) {
      // les 10 tentatives ont échoué --> lance une erreur
      if (attempt === maxAttempts) {
        throw new Error(`PostgreSQL indisponible après ${maxAttempts} tentatives`, {
          cause: error,
        });
      }

      // Attente non bloquante d'une seconde entre deux tentatives.
      await delay(1000);
    }
  }
}

async function truncateTables() {
  // https://stackoverflow.com/questions/3327312/how-can-i-drop-all-the-tables-in-a-postgresql-database
  await prisma.$executeRawUnsafe(`
    DO $$ DECLARE
      r RECORD;
    BEGIN
      FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations') LOOP
        EXECUTE 'TRUNCATE TABLE "' || r.tablename || '" RESTART IDENTITY CASCADE';
      END LOOP;
    END $$;
  `);
};
