import { Ref } from "vue";
import { createThumbnail } from "./common";
import { IAlbum, IMedia, IMediaProperties } from "./definitions";
import { en, es } from "@js/yolo/utils/dictionary.json";

export const getMediaPropertiesIndexedDB = (
  db: IDBDatabase,
  media: IMedia
): Promise<IMediaProperties> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.error("No database");
      reject("No database");
    }
    if (!media || !media.id) {
      console.error("No mediaid");
      reject("No mediaid");
    }
    db
      .transaction("media")
      .objectStore("media")
      .get(Number(media.id)).onsuccess = (event: any) => {
      if (event.target && event.target.result) {
        resolve(event.target.result);
      }
      reject("No media properties found in IndexedDB");
    };
  });
};

export const getMediaIndexedDB = (
  db: IDBDatabase,
  media?: IMedia,
  album?: IAlbum,
  // Filter can be a date (YYYY, YYYY-MM, YYYY-MM-DD), a location
  // or an object from COCO dataset label
  filter?: string
): Promise<IMedia[]> | null => {
  const mediaArray: IMedia[] = [];
  if (!db) {
    console.error("No database");
    return null;
  }
  if ((!media || !media.id) && (!album || !album.id)) {
    console.error("No album or media ID");
    return null;
  }

  const dateFilter = (filter: string, media: IMedia[]) => {
    // Year
    const yearRegex = /^\d{4}$/;
    // Year and month
    const monthRegex = /^\d{4}-\d{2}$/;
    // Year, month and day
    const dayRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (
      yearRegex.test(filter) ||
      monthRegex.test(filter) ||
      dayRegex.test(filter)
    ) {
      return media.filter((m: IMedia) =>
        m.modificationdate?.startsWith(filter)
      );
    }

    return null;
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["media"], "readonly");
    const objectStore = transaction.objectStore("media");
    if (album && album.id && (!media || !media.id)) {
      const index = objectStore.index("albumid");
      const request = index.getAll(album.id);
      request.onsuccess = function () {
        if (filter) {
          let filtered;

          // Check if filter is a date with regex
          filtered = dateFilter(filter, request.result);
          if (filtered) {
            mediaArray.push(...filtered);
            resolve(mediaArray);
            return;
          }

          // Check if filter is a COCO dataset label
          filtered = request.result.filter((media: IMedia) => {
            if (!media.detectedobjects) return false;
            if (media.detectedobjects.includes(filter)) return true;
            // Check if filter is known in the dictionary
            else {
              let dictionary;
              if (navigator.language.startsWith("es")) {
                dictionary = JSON.parse(JSON.stringify(es));
              } else {
                dictionary = JSON.parse(JSON.stringify(en));
              }

              for (const label in dictionary) {
                if (
                  dictionary[label].includes(filter.toLowerCase()) &&
                  media.detectedobjects.includes(label)
                ) {
                  return true;
                }
              }
            }
            return false;
          });
          if (filtered.length > 0) {
            mediaArray.push(...filtered);
            resolve(mediaArray);
            return;
          }

          // Check if filter is a location
          filtered = request.result.filter((media: IMedia) => {
            if (media.location) {
              return media.location
                .toLowerCase()
                .includes(filter.toLowerCase());
            }
          });
          // Allow empty results
          mediaArray.push(...filtered);
          resolve(mediaArray);
          return;
        }

        mediaArray.push(...request.result);
        mediaArray.sort((a: any, b: any) => {
          return (
            new Date(b.modificationdate).getTime() -
            new Date(a.modificationdate).getTime()
          );
        });
        resolve(mediaArray);
      };
      request.onerror = function (e: any) {
        reject("Error getting media from IndexedDB: " + e.target.error);
      };
    } else if (media && media.id) {
      const request = objectStore.get(media.id);

      request.onsuccess = function () {
        if (request.result) {
          mediaArray.push(request.result);
          resolve(mediaArray);
        } else {
          reject("No media found in IndexedDB");
        }
      };

      request.onerror = function (e: any) {
        reject("Error getting media from IndexedDB: " + e.target.error);
      };
    }
  });
};

export const putMediaIndexedDB = async (db: IDBDatabase, media: IMedia) => {
  if (!db) {
    console.error("No database");
    return null;
  }
  if (!media) {
    console.error("No media");
    return null;
  }
  await createThumbnail(media);

  // Check if media already exists and delete it
  try {
    const m = await getMediaIndexedDB(db, media);
    if (m) {
      await deleteMediaIndexedDB(db, media);
    }
  } catch (e) {
    console.warn(e);
  }

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["media"], "readwrite");
    const objectStore = transaction.objectStore("media");
    console.log("Adding media to IndexedDB");

    const request = objectStore.add(media);

    request.onsuccess = function () {
      console.log("Media saved to IndexedDB");
      resolve(true);
    };

    request.onerror = function (e: any) {
      reject("Error saving media to IndexedDB: " + e.target.error);
    };
  });
};

export const deleteMediaIndexedDB = (db: IDBDatabase, media: IMedia) => {
  if (!db) {
    console.error("No database");
    return null;
  }
  if (!media || !media.id) {
    console.error("No media ID");
    return null;
  }
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(["media"], "readwrite")
      .objectStore("media")
      .delete(Number(media.id));

    // Wait for the database transaction to complete
    req.onsuccess = function () {
      console.log("Media deleted from IndexedDB");
      resolve(true);
    };

    req.onerror = function (e: any) {
      reject("Error deleting media from IndexedDB: " + e.target.error);
    };
  });
};

export const waitForIndexedDB = async (db: Ref<IDBDatabase>) => {
  while (!db.value) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
};
