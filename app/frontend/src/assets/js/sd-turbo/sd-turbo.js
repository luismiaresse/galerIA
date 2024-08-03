// This code is based on Microsoft's onnxruntime-inference-examples/js/sd-turbo code (MIT License)
// See https://github.com/microsoft/onnxruntime-inference-examples/tree/main/js/sd-turbo

// TODO list:
// - Free memory somehow (512x512 images take about 8GiB of memory and recreating sessions with another resolution adds more memory)
// - Use input data directly from GPU memory to minimize system RAM usage and improve performance (see https://onnxruntime.ai/docs/tutorials/web/ep-webgpu.html#keep-tensor-data-on-gpu-io-binding
// - Check GPU manufacturer and present a GPU selector to know VRAM size and limit generation params
// - Use ORT simplified and optimized models
// - Use fp32 models if fp16 is not supported

import ort from "onnxruntime-web/webgpu";
import { AutoTokenizer, env } from "@xenova/transformers";
import { checkWebGPUShaderf16, fetchAndCacheModel } from "@ts/common";
import { LOCALSTORAGE_SDTURBO } from "@ts/constants";
import { createI18n } from "vue-i18n";
import en from "@/locales/en.json5";
import es from "@/locales/es.json5";

const i18nGlobal = createI18n({
  locale: navigator.language,
  fallbackLocale: "en-US",
  messages: {
    "es-ES": es,
    es: es,
    "gl-ES": es,
    "en-US": en,
    en: en
  }
});

const $t = i18nGlobal.global.t;

function setParams(state) {
  const width = state.resolution.width;
  const height = state.resolution.height;
  // VAE upscales 8x, so we need to downscale the latents by 1/8 = 0.125x
  const latent_factor = 0.125;

  if (window.sdturbo === undefined) {
    window.sdturbo = {};
    window.sdturbo.loaded = false;
  }
  // Necessary to avoid removing inference session
  if (window.sdturbo.loaded === false || state.resolutionChanged) {
    window.sdturbo.models = {
      unet: {
        url: "unet/model.onnx",
        size: 640,
        opts: {
          freeDimensionOverrides: {
            batch_size: 1,
            num_channels: 4,
            height: height * latent_factor,
            width: width * latent_factor,
            sequence_length: 77
          }
        }
      },
      text_encoder: {
        url: "text_encoder/model.onnx",
        size: 1700,
        opts: { freeDimensionOverrides: { batch_size: 1 } }
      },
      vae_decoder: {
        url: "vae_decoder/model.onnx",
        size: 95,
        opts: {
          freeDimensionOverrides: {
            batch_size: 1,
            num_channels_latent: 4,
            height_latent: height * latent_factor,
            width_latent: width * latent_factor
          }
        }
      }
    };
  }
  const baseURL = import.meta.env.BASE_URL;
  window.sdturbo.config = {
    // model: baseURL + "models/sd2",
    model: "https://huggingface.co/schmuell/sd-turbo-ort-web/resolve/main",
    device: "gpu",
    threads: 1,
    images: state.imageCount,
    width: state.resolution.width,
    height: state.resolution.width,
    latent_factor: latent_factor
  };
  window.sdturbo.loadOpts = {
    executionProviders: ["webgpu"],
    enableMemPattern: false,
    enableCpuMemArena: false,
    extra: {
      session: {
        disable_prepacking: "1"
      }
    }
  };
  window.sdturbo.runOpts = {
    // extra: {
    //     memory: {
    //       enable_memory_arena_shrinkage: "1",
    //     }
    // }
  };
}

/*
 * initialize latents with random noise
 */
function randn_latents(shape, noise_sigma) {
  function randn() {
    // Use the Box-Muller transform
    let u = Math.random();
    let v = Math.random();
    let z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    return z;
  }
  let size = 1;
  shape.forEach((element) => {
    size *= element;
  });

  let data = new Float32Array(size);
  // Loop over the shape dimensions
  for (let i = 0; i < size; i++) {
    data[i] = randn() * noise_sigma;
  }
  return data;
}

/*
 * load models used in the pipeline
 */
async function load_models() {
  const models = window.sdturbo.models;
  const config = window.sdturbo.config;
  const loadOpts = window.sdturbo.loadOpts;

  const cache = await caches.open(LOCALSTORAGE_SDTURBO);
  let missing = 0;
  for (const [name, model] of Object.entries(models)) {
    const url = `${config.model}/${model.url}`;
    let cachedResponse = await cache.match(url);
    if (cachedResponse === undefined) {
      missing += model.size;
    }
  }
  if (missing > 0) {
    let msg = $t("create.status.download");
    console.log(msg);
    document.getElementById("status").innerText = msg;
  } else {
    let msg = $t("create.status.load");
    console.log(msg);
    document.getElementById("status").innerText = msg;
  }
  for (const [name, model] of Object.entries(models)) {
    try {
      const start = performance.now();
      const model_bytes = await fetchAndCacheModel(
        config.model,
        model.url,
        LOCALSTORAGE_SDTURBO
      );
      const sess_opts = { ...loadOpts, ...model.opts };
      models[name].sess = await ort.InferenceSession.create(
        model_bytes,
        sess_opts
      );
      const stop = performance.now();
      console.log(`${model.url} in ${(stop - start).toFixed(1)}ms`);
    } catch (e) {
      console.error(`${model.url} failed, ${e}`);
      (document.getElementById("status").innerText = $t(
        "create.status.error.download"
      )),
        (window.sdturbo.error = true);
    }
  }

  if (window.sdturbo.tokenizer === undefined) {
    try {
      console.log("Loading tokenizer");
      env.allowLocalModels = false;
      env.allowRemoteModels = true;
      env.useBrowserCache = false;
      let tokenizer = await AutoTokenizer.from_pretrained(
        "Xenova/clip-vit-base-patch16"
      );
      tokenizer.pad_token_id = 0;
      window.sdturbo.tokenizer = tokenizer;
      console.log("Tokenizer loaded");
    } catch (e) {
      console.error(`Tokenizer failed, ${e}`);
      document.getElementById("status").innerText = $t(
        "create.status.error.download"
      );
      window.sdturbo.error = true;
    }
  }
  if (window.sdturbo.error !== true) {
    console.log("Models loaded");
  } else {
    console.error("There was an error loading the models");
    document.getElementById("status").innerText = $t(
      "create.status.error.load"
    );
  }
}

/*
 * scale the latents
 */
function scale_model_inputs(t) {
  const d_i = t.data;
  const d_o = new Float32Array(d_i.length);

  const divi = (sigma ** 2 + 1) ** 0.5;
  for (let i = 0; i < d_i.length; i++) {
    d_o[i] = d_i[i] / divi;
  }
  return new ort.Tensor(d_o, t.dims);
}

/*
 * Poor mens EulerA step
 * Since this example is just sd-turbo, implement the absolute minimum needed to create an image
 * Maybe next step is to support all sd flavors and create a small helper model in onnx can deal
 * much more efficient with latents.
 */
function step(model_output, sample) {
  const d_o = new Float32Array(model_output.data.length);
  const prev_sample = new ort.Tensor(d_o, model_output.dims);
  const sigma_hat = sigma * (gamma + 1);

  for (let i = 0; i < model_output.data.length; i++) {
    const pred_original_sample =
      sample.data[i] - sigma_hat * model_output.data[i];
    const derivative = (sample.data[i] - pred_original_sample) / sigma_hat;
    const dt = 0 - sigma_hat;
    d_o[i] = (sample.data[i] + derivative * dt) / vae_scaling_factor;
  }
  return prev_sample;
}

/**
 * draw an image from tensor
 * @param {ort.Tensor} t
 * @param {number} image_nr
 */
function draw_image(t, image_nr) {
  let pix = t.data;
  for (var i = 0; i < pix.length; i++) {
    let x = pix[i];
    x = x / 2 + 0.5;
    if (x < 0) x = 0;
    if (x > 1) x = 1;
    pix[i] = x;
  }
  const imageData = t.toImageData({ tensorLayout: "NCWH", format: "RGB" });
  const canvas = document.getElementById(`create-canvas-${image_nr}`);
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  canvas.getContext("2d").putImageData(imageData, 0, 0);
  const div = document.getElementById(`img-div-${image_nr}`);
  div.style.opacity = 1;
}

const sigma = 14.6146;
const gamma = 0;
const vae_scaling_factor = 0.18215;

async function initSDTurbo(state) {
  if (
    window.sdturbo === undefined ||
    window.sdturbo.loaded === false ||
    state.resolutionChanged
  ) {
    console.log("Initializing SD Turbo model");
    await checkWebGPUShaderf16().then(async (fp16) => {
      if (fp16) {
        const baseURL = import.meta.env.BASE_URL;
        ort.env.wasm.wasmPaths = baseURL + "models/wasm/";
        ort.env.wasm.numThreads = 1;
        ort.env.webgpu.powerPreference = "high-performance";

        setParams(state);

        switch (window.sdturbo.loadOpts.provider) {
          case "webgpu":
            if (!("gpu" in navigator)) {
              const err_msg = "Your browser doesn't support webGPU";
              console.error(err_msg);
              document.getElementById("status").innerText = err_msg;
              return;
            }
            window.sdturbo.loadOpts.preferredOutputLocation = {
              last_hidden_state: "gpu-buffer"
            };
            break;
          case "webnn":
            if (!("ml" in navigator)) {
              const err_msg = "Your browser doesn't support webNN";
              console.error(err_msg);
              document.getElementById("status").innerText = err_msg;
              return;
            }
            window.sdturbo.loadOpts.executionProviders = [
              {
                name: "webnn",
                deviceType: config.device,
                powerPreference: "high-performance"
              }
            ];
            break;
        }
        await load_models();
        if (window.sdturbo.error !== true) {
          window.sdturbo.loaded = true;
        }
      } else {
        const err_msg = "Your GPU or Browser doesn't support webgpu/f16";
        console.error(err_msg);
        document.getElementById("status").innerText = err_msg;
      }
    });
  }
}

function freeSessions() {
  if (window.sdturbo !== undefined && window.sdturbo.models !== undefined) {
    for (const [name, model] of Object.entries(window.sdturbo.models)) {
      if (model.sess !== undefined) {
        model.sess.release();
        model.sess = undefined;
        console.log(`Released ${name}`);
      }
    }
    window.sdturbo.models = undefined;
    window.sdturbo = undefined;
  }
}

async function generateSDTurbo(prompt, state) {
  if (window.sdturbo === undefined || window.sdturbo.loaded === false) {
    return;
  }

  const runOpts = window.sdturbo.runOpts;
  const tokenizer = window.sdturbo.tokenizer;
  const models = window.sdturbo.models;
  const config = window.sdturbo.config;
  // If the number of images is different, change config value
  if (state.imageCount !== config.images) {
    config.images = state.imageCount;
  }
  const unloadAfterGeneration = state.unloadAfterGeneration;

  try {
    let msg = $t("create.status.generate");
    console.log(msg);
    document.getElementById("status").innerText = $t("create.status.generate");

    const width = config.width;
    const height = config.height;
    const latent_factor = config.latent_factor;

    // Tokenizer
    // Input: prompt
    // Output: tokenized prompt
    const { input_ids } = await tokenizer(prompt, {
      padding: true,
      max_length: 77,
      truncation: true,
      return_tensor: false
    });

    // Text encoder
    // Input: tokenized prompt
    // Output: a vector for each token (representation of closest values in an image)
    let start = performance.now();
    const { last_hidden_state } = await models.text_encoder.sess.run(
      { input_ids: new ort.Tensor("int32", input_ids, [1, input_ids.length]) },
      runOpts
    );
    let perf_info = [
      `text_encoder: ${(performance.now() - start).toFixed(1)}ms`
    ];

    for (let j = 0; j < config.images; j++) {
      const latent_shape = [
        1,
        4,
        width * latent_factor,
        height * latent_factor
      ];
      let latent = new ort.Tensor(
        randn_latents(latent_shape, sigma),
        latent_shape
      );
      const latent_model_input = scale_model_inputs(latent);

      // UNet
      // Input: sample (random noise used as a starting point),
      //        timestep (represents the amount of noise to remove),
      //        text encoder output (vectors representing closest values in an image)
      // Output: denoised image for the given timestep
      start = performance.now();
      let feed = {
        sample: latent_model_input,
        timestep: new ort.Tensor("int64", [999n], [1]),
        encoder_hidden_states: last_hidden_state
      };
      let { out_sample } = await models.unet.sess.run(feed, runOpts);
      perf_info.push(`unet: ${(performance.now() - start).toFixed(1)}ms`);
      for (const key in feed) {
        if (key !== "encoder_hidden_states") feed[key].dispose();
      }

      // Scheduler
      const new_latents = step(out_sample, latent);
      out_sample.dispose();
      latent.dispose();

      // VAE Decoder
      // Input: latent sample
      // Output: image
      start = performance.now();
      const { sample } = await models.vae_decoder.sess.run(
        { latent_sample: new_latents },
        runOpts
      );
      perf_info.push(
        `vae_decoder: ${(performance.now() - start).toFixed(1)}ms`
      );

      draw_image(sample, j);
      console.log(perf_info.join(", "));
      perf_info = [];
    }
    // Unload models (does not free system memory)
    if (unloadAfterGeneration) {
      freeSessions();
    }
    last_hidden_state.dispose();
    console.log("Done");
  } catch (e) {
    console.log(e);
  }
}

export { initSDTurbo, generateSDTurbo };
