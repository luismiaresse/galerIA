import { MediaKinds, SharePermissionKinds } from "./common";

export interface IMedia {
  id?: number;
  albumid?: number;
  albumname?: string;
  filename?: string;
  modificationdate?: string;
  kind?: MediaKinds.IMAGE | MediaKinds.VIDEO | MediaKinds.PROFILE;
  label?: string;
  // Coordinates format: latitude,longitude
  coordinates?: string;
  location?: string;
  // Objects format: each separated by ;
  detectedobjects?: string;
  file?: File | Blob | null;
  url?: string;
  thumbnail?: File | Blob | null;
}

// Extend IMedia with the new properties
export interface IMediaProperties extends IMedia {
  width: number;
  height: number;
  mp: number;
  albums: string[];
}

export interface IAlbum {
  id?: number;
  name?: string;
  creationdate?: string;
  lastupdate?: string;
  code?: string;
  permissions?:
    | SharePermissionKinds.READ_ONLY
    | SharePermissionKinds.READ_WRITE
    | SharePermissionKinds.FULL_ACCESS;
}

export interface IUser {
  id?: number;
  username?: string;
  email?: string;
  password?: string;
}

export interface IUserData extends IUser {
  photoid?: number;
  photo?: File | Blob | null;
  expiry?: number;
}

export interface IUserAlbum extends IAlbum {
  elements?: number;
  cover?: number;
  shared?: boolean;
  sharedOwned?: boolean;
}

export interface IUserMedia extends IMedia {
  iscover: boolean;
  albumid: number;
  albumname: string;
}

// YOLO model returns an array of objects with label and probability
export interface IDetections {
  label: string;
  probability: number;
}
