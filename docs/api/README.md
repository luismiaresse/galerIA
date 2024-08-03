# API Docs

To view the API docs including all endpoints and arguments, use the following commands, asuming you are in the root of the project:

- Pull the image:

`docker pull swaggerapi/swagger-ui`

- Run a container:

`docker run -p 3000:8080 -e SWAGGER_JSON=/mnt/schema.yml -v ./docs/api/schema.yml:/mnt/schema.yml swaggerapi/swagger-ui`

- Access the docs at `http://localhost:3000`
