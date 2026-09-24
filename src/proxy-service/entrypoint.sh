#!/bin/sh

# Dans le container : copie le contenu de `/etc/nginx/templates/oquiz.conf.template` dans `oquiz.conf`
# 
# tout en remplaçant le contenu des variables d'environnement écrites dans le fichier
envsubst '${CLIENT_SERVER_NAME} ${API_SERVER_NAME}' < /etc/nginx/templates/oquiz.conf.template > /etc/nginx/conf.d/oquiz.conf

# Supprimer la config par défaut de nginx
rm -f /etc/nginx/conf.d/default.conf

# Démarrer NGINX manuellement en tâche de fond
# (puisqu'on écrase le entrypoint par défaut, il faut alors le faire soit même)
nginx -g 'daemon off;'
