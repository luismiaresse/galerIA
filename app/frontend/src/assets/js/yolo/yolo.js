// This and utils code modified from https://github.com/Hyuto/yolov8-onnxruntime-web

import { fetchAndCacheModel } from "@ts/common";
import { detectImages } from "./utils/detect.js";

async function loadYOLO() {
  const loadError = (e) => {
    console.error("Failed to load model: " + e);
    return;
  };

  const baseURL = import.meta.env.BASE_URL;

  // Configs
  const modelName = "yolov8n.ort";
  const modelInputShape = [1, 3, 640, 640];
  const topk = 100;
  const iouThreshold = 0.45;
  const scoreThreshold = 0.35;
  const baseModelURL = baseURL + "models/yolo";

  console.log("Loading YOLO model...");

  const yoloArrayBuffer = await fetchAndCacheModel(
    baseModelURL,
    modelName,
    "yolo"
  );

  const nmsArrayBuffer = await fetchAndCacheModel(
    baseModelURL,
    "nms-yolov8.ort",
    "yolo"
  );

  console.log("Model loaded");

  // Store global variables
  window.yolo = {};
  window.yolo.model = yoloArrayBuffer;
  window.yolo.nms = nmsArrayBuffer;
  window.yolo.config = [modelInputShape, topk, iouThreshold, scoreThreshold];
}

async function loadAndRunYOLO(images) {
  const start = performance.now();
  if (!window.yolo) {
    console.warn("YOLO model not loaded");
    await loadYOLO();
  }
  const load = performance.now();
  console.log("Load time: " + (load - start).toFixed(2) + "ms");
  return detectImages(images);
}

export default loadAndRunYOLO;
