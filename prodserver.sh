
# Vite build
cd app
npm run "build production"
cd ..

# Change DEBUG mode to False
sed -i 's/DEBUG = True/DEBUG = False/g' djangoconfig/settings.py

# Copy the build to the server
python manage.py collectstatic --noinput

# Start the server
sudo python manage.py runmodwsgi --reload-on-changes --https-only --https-port=443 --http2 --user luismi --group luismi --ssl-certificate-file cert/2161476915.crt --ssl-certificate-key-file cert/private.key --ssl-ca-certificate-file cert/AAACertificateServices.crt --ssl-verify-client=/admin --server-name www.galeria.software
