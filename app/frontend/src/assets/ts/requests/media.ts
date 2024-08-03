import { mediaBase64 } from "@ts/common";
import { MEDIA_API, MediaKinds, USER_MEDIA_API } from "@ts/constants";
import { IMedia, IUserMedia } from "@ts/definitions";

export const getMedia = async (
  auth: string,
  mediaid?: number,
  albumid?: number,
  skipfiles: boolean = false
): Promise<IMedia[] | null> => {
  if (!auth) {
    console.error("No login token");
    return null;
  }
  try {
    // Create the request URL
    let requestUrl = USER_MEDIA_API;
    if (albumid && mediaid) {
      requestUrl += "?albumid=" + albumid + "&mediaid=" + mediaid;
    } else if (albumid && !mediaid) {
      requestUrl += "?albumid=" + albumid;
    } else if (!albumid && mediaid) {
      requestUrl += "?mediaid=" + mediaid;
    }

    if (skipfiles && !mediaid && !albumid) {
      requestUrl += "?skipfiles=true";
    } else if (skipfiles) {
      requestUrl += "&skipfiles=true";
    }

    // Fetch the data
    const response = await fetch(requestUrl, {
      headers: {
        Authorization: auth
      }
    });
    if (response.status == 404) {
      console.warn("Album media not found");
      return null;
    } else if (response.status !== 200) {
      console.error("Failed to get album media");
      return null;
    }
    const albumMedia: IUserMedia[] = await response.json();

    if (albumMedia.length === 0) {
      console.error("No media found");
      return null;
    }

    // Process the media
    for (const m of albumMedia) {
      // Exclude profile images
      if (m.kind === MediaKinds.PROFILE) continue;
      // Add base64 header to images
      m.file = (await mediaBase64(m.file!, m.kind)) as string;
    }
    return albumMedia;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const putMedia = async (
  auth: string,
  media: IMedia,
  albumid?: number
) => {
  if (!auth) {
    console.error("No login token");
    return null;
  }
  if (!media || (!media.file && !media.id)) {
    console.error("No file or media id");
    return null;
  }

  try {
    const formData = new FormData();
    if (media.file) formData.append("file", media.file);
    if (media.id) formData.append("id", media.id.toString());
    if (media.kind) formData.append("kind", media.kind);
    // Default to image
    else formData.append("kind", MediaKinds.IMAGE);
    if (media.file instanceof File) {
      formData.append(
        "modificationdate",
        new Date(media.file.lastModified).toISOString()
      );
    }
    if (media.filename) formData.append("filename", media.filename);
    if (media.detectedobjects)
      formData.append("detectedobjects", media.detectedobjects);
    if (media.label) formData.append("label", media.label);
    if (media.coordinates) formData.append("coordinates", media.coordinates);
    else if (media.location) formData.append("location", media.location);
    if (albumid) formData.append("albumid", albumid.toString());

    const response = await fetch(MEDIA_API, {
      method: "PUT",
      body: formData,
      headers: {
        Authorization: auth
      }
    });

    if (response.status === 200 || response.status === 201) {
      console.log("Media uploaded or updated");
      const media: IMedia = await response.json();

      return media;
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export async function deleteMedia(
  auth: string,
  mediaid: number,
  albumid?: number
) {
  if (!auth) {
    console.error("No login token");
    return;
  }
  try {
    const formData = new FormData();
    // If no albumid, deletes from default album
    formData.append("id", mediaid.toString());
    if (albumid) formData.append("albumid", albumid.toString());

    const response = await fetch(MEDIA_API, {
      method: "DELETE",
      body: formData,
      headers: {
        Authorization: auth
      }
    });
    if (response.status === 204) {
      console.log("Media deleted");
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
}
