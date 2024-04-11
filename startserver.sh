mkdir -p logs

# Vite server
cd app
npm run "dev production" &> ../logs/vite.log &
cd ..

# Change DEBUG mode to True
sed -i 's/DEBUG = False/DEBUG = True/g' djangoconfig/settings.py

# Django server
python manage.py runserver 0.0.0.0:8000 &> logs/django.log &

