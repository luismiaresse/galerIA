# galerIA

## An open source gallery web application with AI features executed right on the browser

[Deployed website](https://www.galeria.software)

## Features

- **Object detection**: Search through your gallery by objects in the image by using YOLOv8.
- **Image upscaling**: Enhance low resolution images with Remacri.
- **Image generation**: Generate any image you want quickly with the power of Stable Diffussion Turbo.

## Prerequisites

### Client side

To execute most of the models contained in this project, you need to be running the following setup:

- **Browser**: Any browser that supports the WebGPU API. It can be a **recent version of a Chromium-based browser** (Chrome, Edge, Brave, etc.) or the **latest version of Firefox** with the `about:config` flag `dom.webgpu.enabled` set to `true`. Test it [here](https://webgpureport.org/) or inside the app. `shader-f16` should be listed as a feature to be able to use image generation.
**Linux users**: You may need to enable the `#enable-unsafe-webgpu` flag in `chrome://flags` to use WebGPU.

- **GPU**: A **dedicated/integrated GPU** with at least enough VRAM/system RAM:
  - **Image upscaling**: TBD
  - **Image generation (Stable Diffusion Turbo)**: 4GiB for resolutions <= 256x256, 8GiB for resolutions <= 512x512, 16GB for resolutions above.

### Server side

- **Linux environment**: The application was developed and tested in a Linux environment. It may work in other environments, but it is not guaranteed.
- **Docker**: To run the application in a containerized environment. Coming soon.
- **PostgreSQL**: To store authentication, multimedia and metadata.
- **Python 3.10**: To run Django and mod-wsgi backend. Preferably in a virtual environment.

## Installation

### Docker

1. Clone the repository
2. Build the Docker image
3. Run the Docker container

Image coming soon.

### Local

1. Clone the repository
2. Install the dependencies
`$ pip install -r requirements.txt`

3. Create a `.pg_service.conf` file in your `$HOME` directory with the following content, substituting host, user and password values with your own PostgreSQL configuration:

```properties
[galeria]
host=host
port=5432
dbname=galeria
user=galeria
password=password
```

## License

Licensed under AGPLv3. This should be in any fork or redistribution, and should credit contributors as well. See [LICENSE](LICENSE) for more information.
