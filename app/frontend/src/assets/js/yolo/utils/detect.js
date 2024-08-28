/**
 * Run YOLO detection on images
 * @param {HTMLImageElement[]} images Images to detect
 */
export const detectImages = async (images) => {
  const yolo = window.yolo;

  // Transform to ImageBitmap to be transferable
  const imageBitmaps = [];
  for (let i = 0; i < images.length; i++) {
    const imageBitmap = await createImageBitmap(images[i]);
    imageBitmaps.push(imageBitmap);
  }
  // Run session inside a web worker
  return new Promise((resolve, reject) => {
    const yoloworker = new Worker(
      new URL("./inferenceWorker.js", import.meta.url),
      { type: "module" }
    );
    yoloworker.onmessage = function (e) {
      const { detections } = e.data;
      resolve(detections);
    };
    yoloworker.onerror = function (e) {
      console.error("Error from worker", e.message);
      reject(e);
    };

    console.log("Sending images to worker");
    yoloworker.postMessage({ images: imageBitmaps, yolo: yolo });
  });
};
