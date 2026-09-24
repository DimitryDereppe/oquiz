#!/bin/bash

# --- FONCTIONS ---

show_help() {
    echo "Usage: ./deploy.sh [OPTION]"
    echo ""
    echo "Options disponibles :"
    echo "  build             Contruit les images docker"
    echo "  start             Demarrer les containers"
    echo "  stop              Fermer les conteneurs de dev"
}

start() {
    echo "Configuration de la machine locale"
    hosts_entry='127.0.0.1 oquiz.test api.oquiz.test'

    if ! grep -qxF "$hosts_entry" /etc/hosts; then
        printf '\n%s\n' "$hosts_entry" | sudo tee -a /etc/hosts > /dev/null
    fi

    echo "Demarrage des containers..."
    # -p pour indiquer un préfixe pour les noms des containers
    docker compose -f docker-compose.yml -p oquiz --env-file=.env.docker up -d 
}

build() {
    echo "Build des images..."
    # -p pour indiquer un préfixe pour les noms des containers
    docker compose -f docker-compose.yml -p oquiz --env-file=.env.docker build
}

stop() {
    echo "Stop containers..."
    # ne pas oublier le prefixe 
    docker compose -p oquiz down
}

# --- LOGIQUE PRINCIPALE ---

if [ $# -eq 0 ]; then
    show_help
    exit 1
fi

option="${1#--}" # {variable#prefix} => returns variable without smallest prefix if it exists

case "$option" in
    start)
        start
        ;;
    build)
        build
        ;;
    stop)
        stop
        ;;
    *)
        echo "Option inconnue : $1"
        show_help
        exit 1
        ;;
esac
