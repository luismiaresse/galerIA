import { mediaBase64 } from "@ts/common";
import { ALBUM_API, MediaKinds, USER_ALBUMS_API } from "@ts/constants";
import { IAlbum, IUserAlbum } from "@ts/definitions";

export const getAlbum = async (auth: string, albumopts?: IUserAlbum) => {
  if (!auth) {
    console.error("No login token");
    return null;
  }
  try {
    let requestUrl = USER_ALBUMS_API;
    if (albumopts) {
      if (albumopts.id && albumopts.shared)
        requestUrl += "?id=" + albumopts.id + "&shared=true";
      else if (albumopts.name && albumopts.shared)
        requestUrl += "?name=" + albumopts.name + "&shared=true";
      else if (albumopts.id && albumopts.sharedOwned)
        requestUrl += "?id=" + albumopts.id + "&sharedowned=true";
      else if (albumopts.name && albumopts.sharedOwned)
        requestUrl += "?name=" + albumopts.name + "&sharedowned=true";
      else if (albumopts.id) requestUrl += "?id=" + albumopts.id;
      else if (albumopts.name) requestUrl += "?name=" + albumopts.name;
      else if (albumopts.shared) requestUrl += "?shared=true";
      else if (albumopts.sharedOwned) requestUrl += "?sharedowned=true";
    }

    const response = await fetch(requestUrl, {
      headers: {
        Authorization: auth
      }
    });
    if (response.status !== 200) {
      console.error("Failed to get album");
      return null;
    }

    const albumsmeta: IUserAlbum[] = await response.json();

    for (const a of albumsmeta) {
      if (a.cover)
        a.cover = (await mediaBase64(a.cover, MediaKinds.IMAGE)) as string;
    }
    return albumsmeta;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const getSharedAlbumFromCode = async (
  auth: string,
  sharedalbum: IUserAlbum
) => {
  if (!auth) {
    console.error("No login token");
    return null;
  }
  if (!sharedalbum || !sharedalbum.code) {
    console.error("No share code");
    return null;
  }
  try {
    const formData = new FormData();
    formData.append("code", sharedalbum.code);
    const response = await fetch(ALBUM_API, {
      method: "POST",
      headers: {
        Authorization: auth
      },
      body: formData
    });
    if (response.status === 201) {
      console.log("Share accepted");
      sharedalbum = await response.json();
      return sharedalbum;
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const putAlbum = async (
  auth: string,
  album: IAlbum
): Promise<IAlbum | null> => {
  if (!auth) {
    console.error("No login token");
    return null;
  }
  if (!album || !album.name || album.name === "") {
    console.error("No album name");
    return null;
  }
  try {
    const formData = new FormData();
    if (album.name) formData.append("name", album.name);
    if (album.id) formData.append("id", album.id.toString());

    const response = await fetch(ALBUM_API, {
      method: "PUT",
      body: formData,
      headers: {
        Authorization: auth
      }
    });

    if (response.status === 201 || response.status === 200) {
      console.log("Album created");
      const album: IAlbum = await response.json();
      return album;
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const deleteAlbum = async (auth: string, album: IAlbum) => {
  if (!auth) {
    console.error("No login token");
    return false;
  }
  if (!album || !album.id) {
    console.error("No album id");
    return false;
  }
  try {
    const formData = new FormData();
    formData.append("id", album.id.toString());

    const response = await fetch(ALBUM_API, {
      method: "DELETE",
      body: formData,
      headers: {
        Authorization: auth
      }
    });
    if (response.status === 204) {
      console.log("Album deleted");
      return true;
    }
    return false;
  } catch (error) {
    console.error(error);
    return false;
  }
};

export const shareAlbum = async (auth: string, album: IAlbum) => {
  if (!auth) {
    console.error("No login token");
    return null;
  }
  if (!album || !album.id) {
    console.error("No album id");
    return null;
  }

  if (!album.permissions) {
    console.error("No permissions");
    return null;
  }

  try {
    const formData = new FormData();
    formData.append("id", album.id.toString());
    formData.append("permissions", album.permissions);

    const response = await fetch(ALBUM_API, {
      method: "PUT",
      body: formData,
      headers: {
        Authorization: auth
      }
    });
    if (response.status === 200) {
      console.log("Album shared");
      album = await response.json();

      return album;
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};
