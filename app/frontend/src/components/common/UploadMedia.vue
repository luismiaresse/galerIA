<script setup lang="ts">
  import FileProgress from "./FileProgress.vue";
  import { putMedia } from "@ts/requests/media";
  import { detectionsArrayToString, triggerInput } from "@ts/common";
  import { putMediaIndexedDB } from "@ts/indexeddb";
  import { getAuth } from "@ts/auth";
  import { useRoute } from "vue-router";
  import { Ref, inject, ref } from "vue";
  import loadAndRunYOLO from "@js/yolo/yolo";
  import { IDetections, IMedia } from "@ts/definitions";
  import { DEFAULT_ALBUM, MediaKinds } from "@ts/constants";
  import * as ExifReader from "exifreader";
  import { getAlbum } from "@ts/requests/album";

  const route = useRoute();
  const auth = getAuth();
  let albumid = Number(route.params.albumid);
  if (!albumid) {
    let albumopts;
    albumopts = await getAlbum(auth!, { name: DEFAULT_ALBUM });
    if (albumopts && albumopts.length === 1) albumid = albumopts[0].id!;
    else throw new Error("No albumid");
  }
  const emit = defineEmits(["refreshMedia"]);
  const db: Ref<IDBDatabase> | undefined = inject("db");
  const uploadState = ref({
    uploading: false,
    total: 0,
    completed: 0
  });
  const uploadCancelled = ref(false);

  const uploadPhotos = async () => {
    if (!db || !db.value) {
      console.error("No indexedDB");
      return;
    }
    // 1. Get files
    const files: FileList = await $("#upload-photos").prop("files");

    if (!files) {
      console.error("No files to upload");
      return;
    }

    if (!auth) {
      console.error("No login token");
      return;
    }

    try {
      // 2. Run YOLO model to detect objects
      const images: ImageBitmap[] = [];
      const filesArray = Array.from(files);
      uploadState.value.total = filesArray.length;
      uploadState.value.uploading = true;

      // Create image bitmaps from the files
      for (const file of filesArray) {
        const image = await createImageBitmap(file);
        images.push(image);
      }

      // Check if we are on development or production
      let detections: Array<Array<IDetections>> = [];
      detections = await loadAndRunYOLO(images);

      // 3. Upload media with a request to the server
      let media;
      for (const file of filesArray) {
        // If user cancelled upload from the FileProgress component
        if (uploadCancelled.value) break;

        let detectionsString = "";
        const detectionsIndex = filesArray.indexOf(file);
        detectionsString = detectionsArrayToString(detections[detectionsIndex]);
        // Get location
        const tags = await ExifReader.load(file);
        const lat = tags["GPSLatitude"];
        const lon = tags["GPSLongitude"];

        // Concat the lat and lon into a string separated by a comma
        // Longitude is negative to be east instead of west
        const coordinates =
          lat && lon ? `${lat.description},${-lon.description}` : undefined;

        const mediaUp: IMedia = {
          file: file,
          filename: file.name,
          kind: MediaKinds.IMAGE,
          detectedobjects: detectionsString,
          coordinates: coordinates
        };

        media = await putMedia(auth, mediaUp, { id: albumid });
        if (!media || !media.id) {
          console.error("Error uploading media");
          // TODO Show error
          return;
        }

        media.albumid = albumid;
        media.file = mediaUp.file;

        // Add media to the indexedDB
        await putMediaIndexedDB(db.value, media);
        // Update current progress
        uploadState.value.completed++;
      }
    } catch (error) {
      // TODO Show upload error
      console.error("Error uploading photos: " + error);
    }

    // 4. Reset upload state and update media list
    uploadCancelled.value = false;
    window.onbeforeunload = null;
    uploadState.value.uploading = false;
    uploadState.value.total = 0;
    uploadState.value.completed = 0;
    emit("refreshMedia", db.value);
  };

  const uploadVideos = async () => {
    if (!db || !db.value) {
      console.error("No indexedDB");
      return;
    }
    // 1. Get files
    const files: FileList = await $("#upload-videos").prop("files");

    if (!files) {
      console.error("No files to upload");
      return;
    }

    if (!auth) {
      console.error("No login token");
      return;
    }

    uploadState.value.uploading = true;
    uploadState.value.total = files.length;
    uploadState.value.completed = 0;

    try {
      // 2. Upload media with a request to the server
      let media;
      for (const file of Array.from(files)) {
        if (uploadCancelled.value) break;

        const mediaUp: IMedia = {
          file: file,
          filename: file.name,
          kind: MediaKinds.VIDEO
        };

        media = await putMedia(auth, mediaUp, { id: albumid });
        if (!media || !media.id) {
          console.error("Error uploading media");
          // TODO Show error
          return;
        }

        media.albumid = albumid;
        media.file = mediaUp.file;

        // Add media to the indexedDB
        await putMediaIndexedDB(db.value, media);
        uploadState.value.completed++;
      }
    } catch (error) {
      // TODO Show upload error
      console.error("Error uploading videos: " + error);
    }

    // 3. Update the media list
    uploadCancelled.value = false;
    window.onbeforeunload = null;
    uploadState.value.uploading = false;
    uploadState.value.total = 0;
    uploadState.value.completed = 0;
    emit("refreshMedia", db.value);
  };
</script>

<template>
  <div
    id="upload-bottom"
    class="dialog-translucent p-6 flex flex-row justify-center gap-6 bottom-0 fixed border-b-0"
  >
    <md-filled-button
      class="upload-button"
      @click="triggerInput('#upload-photos')"
      :disabled="uploadState.uploading"
      >{{ $t("photos.uploadPhotos") }}
      <md-icon slot="icon">photo</md-icon>
      <input
        hidden
        type="file"
        id="upload-photos"
        @change="uploadPhotos"
        multiple
        accept="image/*"
      />
    </md-filled-button>
    <md-filled-button
      class="upload-button"
      @click="triggerInput('#upload-videos')"
      :disabled="uploadState.uploading"
      >{{ $t("photos.uploadVideos") }}
      <md-icon slot="icon">movie</md-icon>
      <input
        hidden
        type="file"
        id="upload-videos"
        @change="uploadVideos"
        multiple
        accept="video/*"
      />
    </md-filled-button>
  </div>
  <FileProgress
    v-if="uploadState.uploading"
    :total="uploadState.total"
    :completed="uploadState.completed"
    @cancel-upload="uploadCancelled = true"
  />
</template>

<style scoped lang="scss">
  @import "@css/custom-media.css";

  @media (--mobile-m) {
    #upload-bottom {
      flex-direction: column;
      gap: 4px !important;

      .upload-button {
        margin: 5px 0 !important;
      }
    }
  }

  #upload-bottom {
    min-width: 100%;
    left: 0;
    right: 0;
    border-radius: 30px 30px 0 0;

    .upload-button {
      margin: 0 5px;
    }
  }
</style>
