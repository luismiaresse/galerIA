
projectdir="$(pwd)"
if [ "$(basename $projectdir)" != "galerIA" ]; then
    echo "This script must be run from the project root due to risk of removing wrong usermedia folder"
    exit 1
fi

usermediaFolder="$projectdir/app/backend/usermedia-test"

function stop() {
    docker-compose -f "$projectdir/docker-compose-dev.yml" stop
    pkill -f runserver
    pkill -f vite
    echo "Stopped servers"
    # Change DEBUG mode to False
    sed -i 's/DEBUG = True/DEBUG = False/g' "$projectdir/app/backend/djangoconfig/settings.py"
    exit 0
}

# Stop servers on signals
trap stop ERR
trap stop SIGTERM
trap stop SIGINT
trap stop SIGHUP

arg=$1

if [ "$arg" == "down" ]; then
    docker-compose -f "$projectdir/docker-compose-dev.yml" down
    printf "\nRemoving usermedia content...\n"
    rm -rf "$usermediaFolder"/*
    stop
fi


# DB server
docker-compose -f docker-compose-dev.yml build
docker-compose -f docker-compose-dev.yml up -d




# Wait for DB to be healthy
while [ "$(docker inspect --format '{{.State.Health.Status}}' galeria-db-dev)" != "healthy" ]; do
    sleep 0.5
done

# Check if port is open to receive connections and apply migrations
./db/wait-for-it.sh localhost:5432

# Vite server
cd app/frontend
npm run dev -- --host &> vite.log &

cd ../backend


# Change DEBUG mode to True
sed -i 's/DEBUG = False/DEBUG = True/g' djangoconfig/settings.py

python manage.py migrate

cd ../..

# Django server
python app/backend/manage.py runserver 0.0.0.0:8000
