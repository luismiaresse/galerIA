import { MediaKinds } from "./constants";
import { IDetections, IMedia, IUser } from "./definitions";
// Common functions

// Trigger a click event on an input element
export const triggerInput = (id: string) => {
  $(id).trigger("click");
};

// Reload the page
export const triggerReload = () => {
  location.reload();
};

export const mediaBlob = async (
  file: string | Blob | File
): Promise<Blob | null> => {
  if (!file) return null;

  // Includes File
  if (file instanceof Blob) {
    return file;
  }

  // File URL
  if (file.startsWith("blob:")) {
    const response = await fetch(String(file));
    file = await response.blob();
    if (!file) return null;
    return file;
  }

  // Base64
  if (file.startsWith("data:video") || file.startsWith("data:image")) {
    // Transform base64 to blob
    const response = await fetch(String(file));
    file = await response.blob();
    if (!file) return null;
    return file;
  }
  return null;
};

export const intlNumberDate = (
  date: number,
  dateStyle?: "full" | "long" | "medium" | "short",
  timeStyle?: "full" | "long" | "medium" | "short",
  language?: string
) => {
  if (!language) {
    language = "en-US";
  }
  return new Intl.DateTimeFormat(language, {
    dateStyle: dateStyle,
    timeStyle: timeStyle
  }).format(date);
};

export const intlStringDate = (
  date: string,
  dateStyle?: "full" | "long" | "medium" | "short",
  timeStyle?: "full" | "long" | "medium" | "short",
  language?: string
) => {
  if (!language) {
    language = "en-US";
  }
  return new Intl.DateTimeFormat(language, {
    dateStyle: dateStyle,
    timeStyle: timeStyle
  }).format(new Date(date));
};

export const getURLFromBlob = (blob?: Blob | File | null) => {
  if (!blob) {
    return "";
  }
  return URL.createObjectURL(blob);
};

export const detectionsArrayToString = (detections: IDetections[]) => {
  if (!detections) {
    return "";
  }
  // Join unique labels with ";"
  return detections
    .map((detection) => detection.label)
    .filter((label, index, self) => self.indexOf(label) === index)
    .join(";");
};

export const checkUsernameUser = (user: IUser) => {
  // Regex to check if username is valid (upper and lower case letters, numbers, dots, underscores and dashes)
  // Username must start with a letter and be between 4 and 20 characters long
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9._-]{3,19}$/gm;
  return usernameRegex.test(user.username as string);
};

export const checkUsername = (username: string) => {
  // Regex to check if username is valid (upper and lower case letters, numbers, dots, underscores and dashes)
  // Username must start with a letter and be between 4 and 20 characters long
  const usernameRegex = /^[a-zA-Z][a-zA-Z0-9._-]{3,19}$/gm;
  return usernameRegex.test(username);
};

export const checkEmailUser = (user: IUser) => {
  // Regex to check if email is valid
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/gm;
  return emailRegex.test(user.email as string);
};

export const checkEmail = (email: string) => {
  // Regex to check if email is valid
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/gm;
  return emailRegex.test(email);
};

export const checkPasswordUser = (user: IUser) => {
  // Check if password is valid (8 characters long)
  if (!user.password) {
    return false;
  }
  return user.password.length >= 8;
};

export const checkPassword = (password: string) => {
  // Check if password is valid (8 characters long)
  if (!password) {
    return false;
  }
  return password.length >= 8;
};

export const createThumbnail = (media: IMedia): Promise<IMedia> | null => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Return a promise
  return new Promise((resolve, reject) => {
    if (media.kind === MediaKinds.IMAGE || media.kind === MediaKinds.PROFILE) {
      const img = new Image();
      img.src = URL.createObjectURL(media.file!);
      img.onload = () => {
        const thumbHeight = 200;
        const thumbWidth = (img.width / img.height) * thumbHeight;
        canvas.width = thumbWidth;
        canvas.height = thumbHeight;
        if (!ctx) {
          reject("No canvas context");
          return;
        }
        ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject("No blob");
              return;
            }
            media.thumbnail = blob;
            resolve(media);
          },
          "image/jpeg",
          0.8
        );
      };
    } else if (media.kind === MediaKinds.VIDEO) {
      // Do not create thumbnail for videos
      resolve(media);
    } else {
      reject("Unsupported media kind");
    }
  });
};

/*
 * fetch and cache model
 */
export async function fetchAndCacheModel(
  base_url: string,
  model_name: string,
  cache_name: string
) {
  const url = `${base_url}/${model_name}`;
  console.log(`Fetching from ${url}`);

  try {
    const cache = await caches.open(cache_name);
    let cachedResponse = await cache.match(url);
    if (cachedResponse == undefined) {
      await cache.add(url);
      cachedResponse = await cache.match(url);
      console.log(`${model_name} (network)`);
      // document.getElementById("status").innerText = `${model_name} (network)`;
    } else {
      console.log(`${model_name} (cached)`);
      // document.getElementById("status").innerText = `${model_name} (cached)`;
    }
    const data = await cachedResponse?.arrayBuffer();
    return data;
  } catch (e) {
    console.error(`Failed to fetch ${model_name} from cache, ${e}`);
    console.log(`${model_name} (network)`);
    return await fetch(url).then((response) => response.arrayBuffer());
  }
}

export async function checkWebGPU() {
  if (!navigator.gpu) {
    console.error("WebGPU not supported");
    // $("#status")[0].innerText = "WebGPU not supported";
    return false;
  } else {
    const device = await navigator.gpu.requestAdapter();
    if (!device) {
      console.error("Failed to get WebGPU adapter");
      // $("#status")[0].innerText = "Failed to get WebGPU adapter";
      return false;
    }
  }
  console.log("WebGPU supported");
  return true;
}

// Check if the device supports the f16 shaders
export async function checkWebGPUShaderf16() {
  try {
    const adapter = await navigator.gpu.requestAdapter();
    if (adapter?.features.has("shader-f16")) return true;
    return false;
  } catch (e) {
    return false;
  }
}

// Gets the date from an ISO date string
export const getDate = (isodate: string) => {
  return new Date(isodate.split("T")[0]).getTime();
};
