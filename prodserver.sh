
# Change DEBUG mode to False
sed -i 's/DEBUG = True/DEBUG = False/g' app/backend/djangoconfig/settings.py

# Docker compose
docker-compose -f docker-compose-prod.yml build
docker-compose -f docker-compose-prod.yml up


