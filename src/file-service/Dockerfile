FROM node:22-bookworm-slim
WORKDIR /app
# Prisma Migrate utilise un moteur natif lié aux bibliothèques OpenSSL.
RUN apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*
COPY package*.json ./
# Conserver Prisma avec ses devDependency pour les migrations au démarrage.
RUN npm ci --include=dev
COPY . .
RUN npm run db:generate && mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=5000
EXPOSE 5000

# Les variables de connexion sont injectées au lancement, pas pendant le build.
# exec transmet les signaux d'arrêt au processus du service.
CMD ["sh", "-c", "npm run db:migrate:deploy && exec ./node_modules/.bin/tsx index.ts"]
