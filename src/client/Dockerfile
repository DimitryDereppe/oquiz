# ==== STAGE 1 : Build de l'application (création d'un dossier ./dist) ====
# Partir d'une image Node.js légère : node:22-alpine
FROM node:22-alpine AS builder

# Créer un répertoire de travail /app
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY ./package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste des fichiers
COPY ./ ./

# On va définir notre argument
ARG VITE_API_BASE_URL=http://localhost:4001/api

# On défini notre variable d'environnement et on lui passe notre argument en parametre
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Lancer le build avec npm run build
# Créer un dossier nommé ./dist de code compilé
RUN npm run build

# On expose le port (facultatif)
# EXPOSE 4173

# puis lancer le serveur Vite avec npm run preview
# Ca va lancer le code qui est présent dans le dossier ./dist
# "--"" est un séparateur qui permet de séparé les options de la commande
# Sans multi-stage, on aurait besoin de cette instruction :
# CMD ["npm", "run", "preview", "--", "--host"]

# ==== STAGE 2 : Lancement du fichier ./dist dans Nginx ====

# Partir d'une image nginx:alpine
# Documentation https://hub.docker.com/_/nginx
FROM nginx:alpine

# Suppression des fichiers index.html et 50x.html contenu dans /usr/share/nginx/html
# /usr/share/nginx/html est le répertoire qui est lu sur le port 80 par NGinx
RUN rm -rf /usr/share/nginx/html/*

# Copier le résultat du build de l'étape précédente dans /usr/share/nginx/html
# À l'aide du flag --from=builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Exposer le port 80
EXPOSE 80

# Définir la commande de lancement de Nginx
# Généralement nginx -g 'daemon off;'
CMD ["nginx", "-g", "daemon off;"]

# Si vous souhaitez créer l'image manuellement : docker build --build-arg VITE_API_BASE_URL=http://localhost:4001/api -t client-image:x ./
# x étant le numéro de la version que vous souhaitez