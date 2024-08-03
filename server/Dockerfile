FROM nginx

# Nginx setup
COPY ./galeria.conf /etc/nginx/sites-available/galeria.conf
RUN mkdir /etc/nginx/sites-enabled

RUN ln -s /etc/nginx/sites-available/galeria.conf /etc/nginx/sites-enabled/galeria.conf

COPY ./nginx.conf /etc/nginx/nginx.conf

COPY ./ssl /app/server/ssl