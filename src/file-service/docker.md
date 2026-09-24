# Image et conteneur du file-service

Le file-service reçoit les fichiers uploadés et permet de les récupérer. Il conserve leur contenu dans un dossier et leurs métadonnées (nom, type MIME, etc.) dans une BDD PostgreSQL dédiée et exécutée dans un autre conteneur.

## Construire l’image

Le `Dockerfile` décrit la recette de l’image ; le conteneur est une instance de cette image. Ici, on part de `node:22-bookworm-slim`, une base Debian allégée avec Node.js, le code du service est installé dans `/app`.

`npm ci` installe les versions des dépendances prévues par le `package-lock.json`. Les dépendances de développement sont conservées ici, car la commande Prisma utilisée pour les migrations en fait partie.

OpenSSL fournit les bibliothèques nécessaires au moteur natif de Prisma Migrate dans cette image. 

`npm run db:generate` génère le client Prisma à partir du schéma, sans créer les tables ni contacter PostgreSQL. Le dossier `uploads` est également créé pendant le build.

Le `.dockerignore` exclut du contexte de build les fichiers inutiles ou propres à la machine locale : `node_modules`, `.env`, `uploads`, `logs` et `tests`. Les dépendances et le client Prisma sont ainsi préparés dans l’image elle-même.

## Démarrer le conteneur

Au démarrage, `npm run db:migrate:deploy` applique les migrations existantes, puis `tsx` exécute le serveur TypeScript. Le `&&` entre les commandes signifie que le serveur ne démarre que si les migrations réussissent ; il n’y a pas de surveillance des changements du code comme en développement.

PostgreSQL doit donc être disponible à ce moment-là. Dans notre Compose, le `healthcheck` de `files-database` et la condition `service_healthy` font attendre le *file-service* avant son démarrage.

Compose injecte les variables d’environnement suivantes :

- `DATABASE_URL` : connexion à PostgreSQL, avec `files-database:5432` comme adresse interne.
- `ALLOWED_ORIGINS` : origines autorisées par la configuration CORS.
- `PORT` : port d’écoute du service, ici `5000`.

Dans le conteneur, `localhost` désigne le *file-service* lui-même, pas la BDD. Les valeurs de connexion sont fournies au lancement et ne sont pas enregistrées dans l’image.

## Accéder au service

`EXPOSE 5000` documente le port prévu ; cette instruction ne publie pas le port sur la machine hôte. L’API contacte le service sur `http://file-service:5000` grâce au réseau Docker commun, sans publication de port supplémentaire.

## Conserver les fichiers uploadés

Dans le `docker-compose.yml` à la racine du projet, ce montage relie un dossier de l’hôte au dossier utilisé par le service :

```yaml
volumes:
  - ./file-service/uploads:/app/uploads
```

À gauche se trouve le dossier de l’hôte, à droite son emplacement dans le conteneur. Les fichiers uploadés restent donc disponibles quand on supprime ou recrée le conteneur ; le dossier doit être accessible en écriture par le service.

Les métadonnées sont conservées séparément dans le volume `files-volume` de PostgreSQL. Pour préserver les uploads et pouvoir les retrouver via l’API, il faut conserver à la fois ce volume et le dossier de fichiers.

## Reconstruire et vérifier

Depuis la racine du projet contenant le Compose (le dossier `src\`), reconstruire puis recréer le service après une modification de son code :

```sh
docker compose -p oquiz --env-file .env.docker up -d --build file-service
```

Un simple redémarrage ne met pas à jour le code copié dans l’image. Si le conteneur redémarre en boucle, consulter ses logs, notamment erreurs de migration :

```sh
docker compose -p oquiz --env-file .env.docker logs --tail 100 file-service
```
