import * as ort from "onnxruntime-web/webgpu";
import cv from "@techstark/opencv-js";

const loadError = (e: any) => {
  console.error("Failed to load model: " + e);
  $("#status")[0].innerText = "Failed to load model: " + e;
  return;
};

/*
 * fetch and cache model
 */
async function fetchAndCache(base_url: string, model_path: string) {
  const url = `${base_url}${model_path}`;
  try {
    const cache = await caches.open("onnx");
    let cachedResponse = await cache.match(url);
    if (cachedResponse == undefined) {
      await cache.add(url);
      cachedResponse = await cache.match(url);
      console.log(`${model_path} (network)`);
      $("#status")[0].innerText = `${model_path} (network)`;
    } else {
      console.log(`${model_path} (cached)`);
      $("#status")[0].innerText = `${model_path} (cached)`;
    }
    const data = await cachedResponse?.arrayBuffer().catch(loadError);
    return data;
  } catch (e) {
    console.error(`Failed to fetch ${model_path} from cache, ${e}`);
    console.log(`${model_path} (network)`);
    return await fetch(url).then((response) => response.arrayBuffer());
  }
}

// TODO Move to web worker
async function upscaleImage(
  image: HTMLImageElement,
  canvas: HTMLCanvasElement
) {
  // Check for WebGPU support
  // checkWebGPU();

  // Load Remacri image upscaling ONNX model
  const baseURL = import.meta.env.BASE_URL;
  const modelURL = baseURL + "models/remacri/4xRemacri.onnx";

  // Wait for OpenCV to be ready
  while (cv.Mat === undefined) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  console.log("OpenCV is ready");

  ort.env.wasm.wasmPaths = baseURL + "models/wasm/";
  ort.env.wasm.simd = true;
  ort.env.wasm.numThreads = navigator.hardwareConcurrency;

  // Load ONNX model
  const modelBuffer = await fetchAndCache(baseURL, modelURL);

  // const arrayBuffer = await fetch(modelURL).then((response) =>
  //   response.arrayBuffer().catch(loadError)
  // );

  console.log(modelBuffer);
  if (!modelBuffer) {
    console.error("Failed to load model");
    return;
  }

  const options = {
    executionProviders: ["webgpu"]
  };

  // const session = await ort.InferenceSession.create(arrayBuffer, options);
  // console.log(session);
  // console.log("Model loaded");
  // Model input shape: [1, 3, image.width, image.height]

  const [inputWidth, inputHeight, channels] = [image.width, image.height, 3]; // RGB
  const [outputWidth, outputHeight] = [inputWidth * 4, inputHeight * 4]; // 4x upscaling
  const imageCV = cv.imread(image);

  console.log(imageCV);

  // Normalize image and remove alpha channel
  imageCV.convertTo(imageCV, cv.CV_32F, 1 / 255.0);
  cv.cvtColor(imageCV, imageCV, cv.COLOR_RGBA2RGB);
  console.log("Image RGB: ", imageCV.data);

  // Transpose image from [width, height, channels] to [1, channels, height, width]
  // imread F32 vector follows the order [red0, green0, blue0, red1, green1, blue1, ...]
  console.log("Pretransposed image", imageCV.data32F);

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

  // Print last 10 values of each band
  console.log("Red band (input)", rBand.slice(-10));
  console.log("Green band (input)", gBand.slice(-10));
  console.log("Blue band (input)", bBand.slice(-10));

  // Put all axis together
  let imageTransposed = new Float32Array(inputBandSize * channels);
  for (let i = 0; i < inputBandSize; i++) {
    imageTransposed[i] = bBand[i];
    imageTransposed[i + inputBandSize] = gBand[i];
    imageTransposed[i + 2 * inputBandSize] = rBand[i];
  }

  console.log("Transposed image", imageTransposed);

  // Separate image into chunks of 64x64x3
  const chunkSize = 64;
  const chunks = [];
  for (
    let i = 0;
    i < inputBandSize * channels;
    i += chunkSize * chunkSize * channels
  ) {
    chunks.push(imageTransposed.slice(i, i + chunkSize * chunkSize * channels));
  }

  console.log("Chunks: ", chunks);

  // Create an input tensor for each chunk
  const inputTensors = [];
  for (const chunk of chunks) {
    const inputTensor = new ort.Tensor("float32", chunk, [
      1,
      channels,
      chunkSize,
      chunkSize
    ]);
    inputTensors.push(inputTensor);
  }

  // Create an inference session for each chunk
  const sessions = [];
  for (const _ of inputTensors) {
    const session = await ort.InferenceSession.create(modelBuffer, options);
    sessions.push(session);
  }

  // Run each session
  const outputTensors = [];
  for (const session of sessions) {
    const inputArray = inputTensors.shift();
    console.log("Input array: ", inputArray);
    if (!inputArray) {
      console.error("Input array is undefined");
      return;
    }

    const outputTensor = await session.run({ input: inputArray });
    outputTensors.push(outputTensor);
  }

  // Merge all output tensors into a single array
  const outputData = new Float32Array(outputWidth * outputHeight * channels);
  // let offset = 0;
  for (const outputTensor of outputTensors) {
    const data = outputTensor.output.data;
    console.log("Output data chunk: ", data);
    console.log("Output data chunk length: ", data.length);
    for (
      let i = 0;
      i < inputBandSize * channels;
      i += chunkSize * chunkSize * channels
    ) {}
  }

  console.log("Output data: ", outputData);

  // const inputTensor = new ort.Tensor("float32", imageTransposed, [
  //   1,
  //   channels,
  //   inputHeight,
  //   inputWidth
  // ]);
  // // Output is incorrect with stable ORT, use dev instead
  // const outputTensor = await session.run({ input: inputTensor });

  // Check output type
  // if (outputTensor.output.data instanceof Float32Array === false) {
  //   console.error("Output data is not a Float32Array");
  //   return;
  // }

  // const outputData = outputTensor.output.data;
  // console.log("Output: ", outputData);
  // const outputShape = outputTensor.output.dims;
  // console.log("Output shape: ", outputShape);

  // Transpose image from [1, channels, height, width] to [width, height, channels]
  // Get each axis
  const outputBandSize = outputWidth * outputHeight;
  rBand = new Float32Array(outputBandSize);
  gBand = new Float32Array(outputBandSize);
  bBand = new Float32Array(outputBandSize);
  j = 0;
  for (let i = 0; i < outputBandSize; i++) {
    rBand[j] = outputData[i];
    gBand[j] = outputData[i + 1 * outputBandSize];
    bBand[j] = outputData[i + 2 * outputBandSize];
    j++;
  }

  // Print last 10 values of each band
  console.log("Red band (output)", rBand.slice(-10));
  console.log("Green band (output)", gBand.slice(-10));
  console.log("Blue band (output)", bBand.slice(-10));

  // Put all axis together
  imageTransposed = new Float32Array(outputBandSize * channels);
  j = 0;
  for (let i = 0; i < outputData.length * channels; i += channels) {
    imageTransposed[i] = bBand[j];
    imageTransposed[i + 1] = gBand[j];
    imageTransposed[i + 2] = rBand[j];
    j++;
  }

  console.log("Transposed output image", imageTransposed);

  // Convert Float32Array to Uint8Array
  let outputImage = new cv.Mat(outputHeight, outputWidth, cv.CV_32FC3);
  outputImage.data32F.set(imageTransposed);
  outputImage.convertTo(outputImage, cv.CV_8U, 255.0);
  console.log("Output postprocessed: ", outputImage.data);

  // Convert from RGB to BGR
  // cv.cvtColor(outputImage, outputImage, cv.COLOR_RGB2BGR);

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  cv.imshow(canvas, outputImage);
}

export { upscaleImage };
