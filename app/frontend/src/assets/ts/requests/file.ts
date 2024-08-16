import { FILE_API } from "@ts/constants";
import { IMedia } from "@ts/definitions";

export const getFile = async (
  auth: string,
  media: IMedia
): Promise<Blob | null> => {
  if (!auth) {
    console.error("No login token");
    return null;
  }
  if (!media || !media.id || !media.kind) {
    console.error("No media");
    return null;
  }
  try {
    const response = await fetch(
      FILE_API + "?mediaid=" + media.id + "&kind=" + media.kind,
      {
        headers: {
          Authorization: auth
        }
      }
    );
    if (response.status === 200) {
      const file = await response.blob();
      return file;
    }
    return null;
  } catch (error) {
    console.error(error);
    return null;
  }
};
