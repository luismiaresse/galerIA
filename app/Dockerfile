FROM python:3.11-slim

COPY . /app

# Frontend setup
WORKDIR /app/frontend

# Install npm
RUN apt-get update && apt-get install -y npm

RUN npm ci
RUN npm run "build production"

# Backend setup
WORKDIR /app/backend

# Create and activate virtual environment
RUN python3 -m venv venv

RUN venv/bin/python -m pip install -r requirements.txt

# Change DEBUG mode to False
RUN sed -i 's/DEBUG = True/DEBUG = False/g' djangoconfig/settings.py

RUN mkdir staticfiles && venv/bin/python manage.py collectstatic --noinput

# exec needed for gunicorn to stop on SIGTERM
# TODO Execute tests with option to skip
CMD [ "sh", "-c", "venv/bin/python manage.py migrate && exec venv/bin/gunicorn --bind 0.0.0.0:8000 djangoconfig.wsgi:application" ]