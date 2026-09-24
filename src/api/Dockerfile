# Dockerfile multi-stage de l'API
# - STAGE 1 (builder) : installe les dépendances, génère le client Prisma et compile le TypeScript
# - STAGE 2 (runtime) : ne récupère que le nécessaire à l'exécution (JS compilé, migrations, node_modules)
#   → les sources TypeScript ne sont pas embarquées dans l'image finale

# ==== STAGE 1 : Build ====
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copier d'abord les fichiers de dépendances : tant qu'ils ne changent pas,
# Docker réutilise la couche en cache et ne réinstalle pas les dépendances
COPY ./package*.json ./
RUN npm install

# Copier le reste du code, générer le client Prisma puis compiler (./dist)
COPY ./ ./
RUN npm run db:generate && npm run build


# ==== STAGE 2 : Exécution ====
FROM node:22-alpine

WORKDIR /usr/src/app

ENV NODE_ENV=production

# node_modules est conservé en entier : la CLI Prisma (devDependency) sert
# à appliquer les migrations au démarrage du conteneur
COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/node_modules ./node_modules
# Code compilé (inclut le client Prisma généré, compilé dans dist/generated)
COPY --from=builder /usr/src/app/dist ./dist
# Schéma + migrations, et configuration lue par la CLI Prisma
COPY --from=builder /usr/src/app/prisma ./prisma
COPY --from=builder /usr/src/app/prisma.config.ts /usr/src/app/config.ts ./

EXPOSE 3000

# Au lancement : migrations, échantillonnage, puis démarrage du serveur
CMD ["npm", "run", "docker:start"]
