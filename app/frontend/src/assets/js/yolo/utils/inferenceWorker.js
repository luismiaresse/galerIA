import cv from "@techstark/opencv-js";
import * as ort from "onnxruntime-web/wasm";
import labels from "./labels.json";

/**
 * Preprocessing image
 * @param {ImageBitmap} source image source
 * @param {Number} modelWidth model input width
 * @param {Number} modelHeight model input height
 * @return preprocessed image and configs
 */
function preprocessing(source, modelWidth, modelHeight) {
  const mat = cv.imread(source); // read from img tag
  const matC3 = new cv.Mat(mat.rows, mat.cols, cv.CV_8UC3); // new image matrix
  cv.cvtColor(mat, matC3, cv.COLOR_RGBA2BGR); // RGBA to BGR

  // padding image to [n x n] dim
  const maxSize = Math.max(matC3.rows, matC3.cols); // get max size from width and height
  const xPad = maxSize - matC3.cols, // set xPadding
    xRatio = maxSize / matC3.cols; // set xRatio
  const yPad = maxSize - matC3.rows, // set yPadding
    yRatio = maxSize / matC3.rows; // set yRatio
  const matPad = new cv.Mat(); // new mat for padded image
  cv.copyMakeBorder(matC3, matPad, 0, yPad, 0, xPad, cv.BORDER_CONSTANT); // padding black

  const input = cv.blobFromImage(
    matPad,
    1 / 255.0, // normalize
    new cv.Size(modelWidth, modelHeight), // resize to model input size
    new cv.Scalar(0, 0, 0),
    true, // swapRB
    false // crop
  ); // preprocessing image matrix

  // release mat opencv
  mat.delete();
  matC3.delete();
  matPad.delete();

  return [input, xRatio, yRatio];
}

onmessage = async function (e) {
  console.log("Worker started");
  const start = performance.now();
  // Wait for OpenCV to be ready
  while (!cv.Mat) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  console.log("OpenCV is ready");

  // Necessary for opencv to work in web worker
  self.HTMLImageElement = ImageBitmap;
  self.HTMLCanvasElement = OffscreenCanvas;
  self.document = {
    createElement() {
      return new OffscreenCanvas(640, 640);
    }
  };

  // Configurar ORT
  const baseURL = import.meta.env.BASE_URL;
  ort.env.wasm.wasmPaths = baseURL + "models/wasm/";
  ort.env.wasm.numThreads = navigator.hardwareConcurrency;
  ort.env.wasm.simd = true;

  // Obtener imágenes y configuración de YOLO
  const { images, yolo } = e.data;
  const [inputShape, topk, iouThreshold, scoreThreshold] = yolo.config;
  const [modelWidth, modelHeight] = inputShape.slice(2);
  const tensors = [],
    xRatios = [],
    yRatios = [];

  const nmsConfig = new ort.Tensor(
    "float32",
    new Float32Array([
      topk, // topk per class
      iouThreshold, // iou threshold
      scoreThreshold // score threshold
    ])
  ); // nms config tensor

  // Create inference session
  const model = await ort.InferenceSession.create(yolo.model);
  const nms = await ort.InferenceSession.create(yolo.nms);
  const create = performance.now();
  console.log("Create time: " + (create - start).toFixed(2) + "ms");

  const selections = [];
  const detections = Array.from({ length: images.length }, () => []); // create boxes array
  for (let i = 0; i < images.length; i++) {
    const [input, xRatio, yRatio] = preprocessing(
      images[i],
      modelWidth,
      modelHeight
    );
    // Guardar tensor con los datos de la imagen y ratios
    tensors.push(new ort.Tensor("float32", input.data32F, inputShape));
    xRatios.push(xRatio);
    yRatios.push(yRatio);
    input.delete(); // release input tensor

    // Ejecutar las inferencias
    const { output0 } = await model.run({ images: tensors[i] }); // run session and get output layer
    const { selected } = await nms.run({
      detection: output0,
      config: nmsConfig
    }); // perform nms and filter boxes
    selections.push(selected);

    // looping through output
    for (let idx = 0; idx < selections[i].dims[1]; idx++) {
      const data = selections[i].data.slice(
        idx * selections[i].dims[2],
        (idx + 1) * selections[i].dims[2]
      ); // get rows
      const scores = data.slice(4); // classes probability scores
      const score = Math.max(...scores); // maximum probability scores
      const labelNum = scores.indexOf(score); // class id of maximum probability scores
      const label = labels[labelNum]; // class label

      detections[i].push({
        label: label,
        probability: score
      });
    }
  }

  console.log("Worker done");
  const end = performance.now();
  console.log("Execution time: " + (end - create).toFixed(2) + "ms");
  postMessage({ detections: detections });
};

export default class InferenceWorker extends Worker {
  constructor() {
    console.log("Inference worker created");
    super(new URL("./inferenceWorker.js", import.meta.url), { type: "module" });
  }
}
