mkdir -p logs

# Vite server
npm run dev &> logs/vite.log &

# Django server
python manage.py runserver 0.0.0.0:8000 &> logs/django.log &

