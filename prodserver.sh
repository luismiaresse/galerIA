POSTGRES_DB=galeria
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

projectdir="$(pwd)"
if [ "$(basename $projectdir)" != "galerIA" ]; then
    echo "This script must be run from the project root due to risk of removing wrong usermedia folder"
    exit 1
fi

function stop() {
    # Backup database
    currentDate=$(date +"%Y-%m-%d_%H-%M-%S")
    docker exec galeria-db pg_dump --no-owner --no-acl -U postgres -f "/backups/$POSTGRES_DB-$currentDate.sql" "$POSTGRES_DB"
    
    docker-compose -f "$projectdir/docker-compose-prod.yml" stop
    exit 0
}

trap stop ERR
trap stop SIGTERM
trap stop SIGINT
trap stop SIGHUP

usermediaFolder="$projectdir/app/backend/usermedia"

arg=$1
if [ "$arg" == "down" ]; then
    docker-compose -f "$projectdir/docker-compose-prod.yml" down
    read -p "Remove usermedia folder ($usermediaFolder) content? (y/N) " -n 1 reply
    reply=${reply:-N}
    
    if [[ $reply =~ ^[Yy]$ && -d "$usermediaFolder" ]]; then
        printf "\nRemoving usermedia content...\n"
        rm -rf "$usermediaFolder"/*
    fi
    exit 0
fi

# Docker compose
docker-compose -f "$projectdir/docker-compose-prod.yml" build
docker-compose -f "$projectdir/docker-compose-prod.yml" up &

sleep infinity
