import { createThumbnail } from "./common";
import { IMedia, IMediaProperties } from "./definitions";
import { en, es } from "@js/yolo/utils/dictionary.json";

export const getMediaPropertiesIndexedDB = (
  db: IDBDatabase,
  mediaid: number
): Promise<IMediaProperties> => {
  return new Promise((resolve, reject) => {
    if (!db) {
      console.error("No database");
      reject("No database");
    }
    if (!mediaid) {
      console.error("No mediaid");
      reject("No mediaid");
    }
    db.transaction("media").objectStore("media").get(mediaid).onsuccess = (
      event: any
    ) => {
      if (event.target && event.target.result) {
        resolve(event.target.result);
      }
      reject("No media properties found in IndexedDB");
    };
  });
};

export const getMediaIndexedDB = (
  db: IDBDatabase,
  albumid: number,
  // Filter can be a date (YYYY, YYYY-MM, YYYY-MM-DD), a file name
  // or an object from COCO dataset label
  filter?: string
): Promise<IMedia[]> | null => {
  const mediaArray: IMedia[] = [];
  if (!db) {
    console.error("No database");
    return null;
  }
  if (!albumid) {
    console.error("No album ID");
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
    const index = objectStore.index("albumid");
    const request = index.getAll(albumid);
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
            return media.location.toLowerCase().includes(filter.toLowerCase());
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
    request.onerror = function () {
      console.error("Error getting media from IndexedDB");
      reject(null);
    };
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
  const m = await createThumbnail(media);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["media"], "readwrite");
    const objectStore = transaction.objectStore("media");
    console.log("Adding media to IndexedDB");

    const media = JSON.parse(JSON.stringify(m));

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

export const deleteMediaIndexedDB = (db: IDBDatabase, mediaid: number) => {
  if (!db) {
    console.error("No database");
    return null;
  }
  if (!mediaid) {
    console.error("No media ID");
    return null;
  }
  return new Promise((resolve, reject) => {
    const req = db
      .transaction(["media"], "readwrite")
      .objectStore("media")
      .delete(mediaid);

    // Wait for the database transaction to complete
    req.onsuccess = function () {
      console.log("Media deleted from IndexedDB");
      resolve(true);
    };

    req.onerror = function () {
      console.error("Error deleting media from IndexedDB");
      reject(false);
    };
  });
};
