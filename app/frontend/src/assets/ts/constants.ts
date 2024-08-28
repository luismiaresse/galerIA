// Enum with media types
export enum MediaKinds {
  IMAGE = "image",
  VIDEO = "video",
  PROFILE = "profile"
}

// Enum with share permissions types
export enum SharePermissionKinds {
  READ_ONLY = "read-only",
  READ_WRITE = "read-write",
  FULL_ACCESS = "full-access"
}

// Constants
export const DEFAULT_ALBUM = "default";
export const LOCALSTORAGE_DEVICE_INFO = "deviceinfo";
export const LOCALSTORAGE_USERDATA = "userdata";
export const LOCALSTORAGE_AUTH = "auth";
export const LOCALSTORAGE_SDTURBO = "sdturbo";
export const AUTH_TOKEN_PREFIX = "Knox ";
export const ALBUM_NAME_MAX_LENGTH = 35;

const baseURL = import.meta.env.BASE_URL;
export const USER_PROFILE_ANONYMOUS = baseURL + "anonymous.webp";

// API paths
export const LOGIN_API = "/api/login";
export const LOGOUT_API = "/api/logout";
export const REGISTER_API = "/api/register";

export const USER_API = "/api/user";
export const MEDIA_API = "/api/media";
export const ALBUM_API = "/api/album";
export const USER_ALBUMS_API = "/api/albums";
export const USER_MEDIA_API = "/api/medias";
export const FILE_API = "/api/file";
