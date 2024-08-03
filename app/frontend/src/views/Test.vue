<script setup>
  import { upscaleImage } from "@ts/remacri/remacri.ts";

  function triggerInputRemacri() {
    $("#remacrifiles").trigger("click");
  }

  function onFileChange() {
    // Load multiple images
    const files = $("#remacrifiles").prop("files");
    console.log(files);
    // Remove all previous images
    const containers = document.getElementsByClassName("test-container");
    while (containers.length > 0) {
      containers[0].remove();
    }
    const file = files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement("img");
      // Create a canvas element per image entered
      const canvas = document.createElement("canvas");
      canvas.width = 0;
      canvas.height = 0;
      // Attach the canvas to the container
      canvas.className = "test-canvas";
      img.className = "test";
      img.src = e.target.result;
      // TODO Allow for bigger images, upscaler with WebGPU fails with resolutions above
      img.width = 362;
      img.height = 362;
      // Attach the image to the container
      const container = document.createElement("div");
      container.classList = "test-container flex flex-column flex-wrap mt-4";
      container.appendChild(img);
      container.appendChild(canvas);
      $("#content").append(container);
    };
    reader.readAsDataURL(file);
  }

  async function upscale() {
    // Use Remacri to upscale the image
    console.log("Upscaling...");
    $("#status").text("Upscaling...");
    const image = $(".test")[0];
    const canvas = $(".test-canvas")[0];
    upscaleImage(image, canvas);
    // canvas.style.width = image.width + "px";
    // canvas.style.height = image.height + "px";
  }
</script>

<template>
  <h2>Remacri upscaler test</h2>
  <p id="status"></p>
  <div class="mt-2">
    <md-outlined-button @click="triggerInputRemacri()" class="mr-4">
      Select image
      <input
        type="file"
        id="remacrifiles"
        accept="image/*"
        @change="onFileChange"
        style="display: none"
      />
    </md-outlined-button>
    <md-filled-button @click="upscale()">Upscale</md-filled-button>
    <div class="test-container flex flex-row mt-4">
      <img class="test" src="@img/256.png" />
      <canvas class="test-canvas" width="0" height="0"></canvas>
    </div>
  </div>
</template>

<style scoped>
  .test {
    width: 300px !important;
    height: 300px !important;
  }
</style>
