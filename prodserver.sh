# Vite build
npm run build

# Copy the build to the server
python manage.py collectstatic -c --noinput

# Start the server
python manage.py runserver
