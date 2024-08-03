
# DB server
docker-compose -f docker-compose-dev.yml up -d

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

function stop() {
    docker-compose -f docker-compose-dev.yml stop
    pkill -f runserver
    pkill -f vite
    echo ""
    echo "Stopped servers"
}

# Stop servers on exit
trap stop EXIT
trap stop ERR
trap stop SIGTERM
trap stop SIGINT
trap stop SIGHUP
