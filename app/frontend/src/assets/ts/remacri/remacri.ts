import * as ort from "onnxruntime-web/webgpu";
import cv from "@techstark/opencv-js";
import { checkWebGPU, fetchAndCacheModel } from "@ts/common";

// const loadError = (e: any) => {
//   console.error("Failed to load model: " + e);
//   $("#status")[0].innerText = "Failed to load model: " + e;
//   return;
// };

// TODO Move to web worker
async function upscaleImage(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement
) {
  // Check for WebGPU support
  const support = await checkWebGPU();
  if (!support) {
    // TODO Run on CPU
    return;
  }

  // Load Remacri image upscaling ONNX model
  const baseURL = import.meta.env.BASE_URL;

  // Wait for OpenCV to be ready
  while (cv.Mat === undefined) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  console.log("OpenCV is ready");

  ort.env.wasm.wasmPaths = baseURL + "models/wasm/";
  ort.env.wasm.numThreads = navigator.hardwareConcurrency;

  const modelURL = baseURL + "models/remacri";
  const modelName = "4xRemacri.onnx";
  const cacheName = "remacri";

  // Load ONNX model
  const arrayBuffer = await fetchAndCacheModel(modelURL, modelName, cacheName);

  if (!arrayBuffer) {
    console.error("Failed to load model");
    return;
  }

  const options = {
    executionProviders: ["webgpu"]
  };

  const session = await ort.InferenceSession.create(arrayBuffer, options);

  // Model input shape: [1, 3, image.width, image.height]
  const [inputWidth, inputHeight, channels] = [image.width, image.height, 3]; // RGB
  const [outputWidth, outputHeight] = [inputWidth * 4, inputHeight * 4]; // 4x upscaling
  const imageCV = cv.imread(image);

  // Normalize image and remove alpha channel
  imageCV.convertTo(imageCV, cv.CV_32F, 1 / 255.0);
  cv.cvtColor(imageCV, imageCV, cv.COLOR_RGBA2RGB);

  // Transpose image from [width, height, channels] to [1, channels, height, width]
  // imread F32 vector follows the order [red0, green0, blue0, red1, green1, blue1, ...]
  // Get each axis
  const inputBandSize = inputWidth * inputHeight;
  let rBand = new Float32Array(inputBandSize);
  let gBand = new Float32Array(inputBandSize);
  let bBand = new Float32Array(inputBandSize);
  let j = 0;
  for (let i = 0; i < imageCV.data32F.length; i += 3) {
    rBand[j] = imageCV.data32F[i];
    gBand[j] = imageCV.data32F[i + 1];
    bBand[j] = imageCV.data32F[i + 2];
    j++;
  }

  // Put all axis together
  let imageTransposed = new Float32Array(inputBandSize * channels);
  for (let i = 0; i < inputBandSize; i++) {
    imageTransposed[i] = bBand[i];
    imageTransposed[i + inputBandSize] = gBand[i];
    imageTransposed[i + 2 * inputBandSize] = rBand[i];
  }

  const inputTensor = new ort.Tensor("float32", imageTransposed, [
    1,
    channels,
    inputHeight,
    inputWidth
  ]);
  // Output is incorrect with stable ORT, use dev instead
  const outputTensor = await session.run({ input: inputTensor });

  // Check output type
  if (outputTensor.output.data instanceof Float32Array === false) {
    console.error("Output data is not a Float32Array");
    return;
  }

  const outputData = outputTensor.output.data;

  // Transpose image from [1, channels, height, width] to [width, height, channels]
  // Get each axis
  const outputBandSize = outputWidth * outputHeight;
  rBand = new Float32Array(outputBandSize);
  gBand = new Float32Array(outputBandSize);
  bBand = new Float32Array(outputBandSize);
  j = 0;
  for (let i = 0; i < outputBandSize; i++) {
    rBand[j] = Number(outputData[i]);
    gBand[j] = Number(outputData[i + 1 * outputBandSize]);
    bBand[j] = Number(outputData[i + 2 * outputBandSize]);
    j++;
  }

  // Put all axis together
  imageTransposed = new Float32Array(outputBandSize * channels);
  j = 0;
  for (let i = 0; i < outputData.length * channels; i += channels) {
    imageTransposed[i] = bBand[j];
    imageTransposed[i + 1] = gBand[j];
    imageTransposed[i + 2] = rBand[j];
    j++;
  }

  // Convert Float32Array to Uint8Array
  let outputImage = new cv.Mat(outputHeight, outputWidth, cv.CV_32FC3);
  outputImage.data32F.set(imageTransposed);
  outputImage.convertTo(outputImage, cv.CV_8U, 255.0);

  // Convert from RGB to BGR
  // cv.cvtColor(outputImage, outputImage, cv.COLOR_RGB2BGR);

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  cv.imshow(canvas, outputImage);
}

export { upscaleImage };
