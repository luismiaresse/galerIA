import { resetAuth } from "@ts/auth";
import { mediaBase64 } from "@ts/common";
import {
  ALBUM_API,
  LOCALSTORAGE_USERDATA,
  MediaKinds,
  USER_API
} from "@ts/constants";
import { IUserData } from "@ts/definitions";

export const setAlbumCover = async (
  auth: string,
  albumid: number,
  mediaid: number
) => {
  if (!auth) {
    console.error("No login token");
    return false;
  }
  if (!albumid || !mediaid) {
    console.error("No album or media id");
    return false;
  }

  try {
    const formData = new FormData();
    formData.append("id", albumid.toString());
    formData.append("mediaid", mediaid.toString());

    const response = await fetch(ALBUM_API, {
      method: "POST",
      body: formData,
      headers: {
        Authorization: auth
      }
    });
    if (response.status === 200) {
      console.log("Album cover updated");
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const changePassword = async (
  auth: string,
  passwordold: string,
  passwordnew: string
) => {
  if (!auth) {
    console.error("No login token");
    return 401;
  }
  if (!passwordold || !passwordnew) {
    console.error("No password");
    return 400;
  }

  try {
    const formData = new FormData();
    formData.append("passwordnew", passwordnew);
    formData.append("passwordold", passwordold);

    const response = await fetch(USER_API, {
      method: "POST",
      headers: {
        Authorization: auth
      },
      body: formData
    });

    return response.status;
  } catch (error) {
    console.error(error);
    return 500;
  }
};

export const getAccountData = async (
  auth: string
): Promise<IUserData | null> => {
  // Check if the user is logged in
  if (!auth) {
    console.error("User is not logged in");
    resetAuth();
    return null;
  }

  // Get data from cache if its not expired
  const cache = await getAccountDataFromCache();
  if (cache) {
    console.log("Data from cache");
    return cache;
  }

  // Get data from server
  try {
    const response = await fetch(USER_API, {
      headers: {
        Authorization: auth
      }
    });
    if (response.status !== 200) {
      console.error("Failed to get user data");
      return null;
    }
    const data: IUserData = await response.json();

    // Add base64 header to photo
    if (data.photo)
      data.photo = (await mediaBase64(data.photo, MediaKinds.IMAGE)) as string;

    // Set expiry date to fetch new data to 1 day
    const now = new Date();
    const expiry = now.getTime() + 1000 * 60 * 60 * 24;
    data.expiry = expiry;

    // Update cache
    localStorage.setItem(LOCALSTORAGE_USERDATA, JSON.stringify(data));
    return data;
  } catch (e) {
    console.error(e);
    return null;
  }
};

async function getAccountDataFromCache() {
  const data = localStorage.getItem(LOCALSTORAGE_USERDATA);

  if (data) {
    const data_json = JSON.parse(data);
    // Check if the data is expired
    if (data_json.expiry) {
      const now = new Date();
      if (data_json.expiry > now.getTime()) {
        return data_json;
      } else {
        localStorage.removeItem(LOCALSTORAGE_USERDATA);
        return null;
      }
    }
    return JSON.parse(data);
  }
  return null;
}

export const deleteAccount = async (auth: string) => {
  if (!auth) {
    console.error("No login token");
    return false;
  }
  try {
    const response = await fetch(USER_API, {
      method: "DELETE",
      headers: {
        Authorization: auth
      }
    });

    if (response.status === 204) {
      resetAuth();
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
};
