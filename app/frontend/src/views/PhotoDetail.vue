<script setup lang="ts">
  import { getAuth } from "@ts/auth";
  import { getMedia, deleteMedia, putMedia } from "@ts/requests/media";
  import { Ref, inject, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { useMediaidsStore } from "@js/stores/mediaids";
  import { intlStringDate } from "@ts/common";
  import { IAlbum, IMedia, IMediaProperties } from "@ts/definitions";
  import {
    deleteMediaIndexedDB,
    getMediaPropertiesIndexedDB
  } from "@ts/indexeddb";
  import Cropper from "cropperjs";
  import { upscaleImage } from "@ts/remacri/remacri";
  import { getAlbum } from "@ts/requests/album";
  import { setAlbumCover } from "@ts/requests/user";
  import { MediaKinds } from "@ts/constants";
  import AlbumSelector from "@/components/albums/AlbumSelector.vue";

  const media: Ref<IMediaProperties | undefined> = ref();
  const route = useRoute();
  const router = useRouter();
  const auth = getAuth();
  const canvas: Ref<HTMLCanvasElement> = ref() as Ref<HTMLCanvasElement>;
  const video: Ref<HTMLVideoElement> = ref() as Ref<HTMLVideoElement>;
  const isMediaChanged = ref(false);
  const currentBlob: Ref<Blob | undefined | null> = ref();

  const db: Ref<IDBDatabase> | undefined = inject("db");
  const mediaidsSt = useMediaidsStore();
  let mediaids: number[] = mediaidsSt.mediaids;
  const albumid = Number(route.params.albumid);
  if (!mediaids || mediaids.length === 0) {
    // Get album metadata
    let album: IAlbum = { id: albumid };
    let albumMeta;
    if (!albumid) {
      albumMeta = await getAlbum(auth!);
    } else {
      albumMeta = await getAlbum(auth!, album);
    }
    if (!albumMeta) {
      throw new Error("No album metadata");
    }

    album = albumMeta[0];

    // Get mediaids of the album
    const medias = await getMedia(auth!, undefined, album, true);
    mediaids = [];
    if (medias) {
      for (const m of medias) {
        mediaids.push(m.id as number);
      }
      mediaidsSt.setMediaids(mediaids);
    }
  }

  let currentmediaid = Number(route.params.mediaid);
  let previousmediaid = mediaidsSt.getPreviousMediaid(currentmediaid);
  let nextmediaid = mediaidsSt.getNextMediaid(currentmediaid);
  const currentRotation = ref(0);
  const previousRotation = ref(0);
  const previousMedia = ref();

  // Bind keyboard arrows to navigate through medias
  window.onkeydown = (e) => {
    if (e.key === "ArrowLeft" && previousmediaid) {
      mediaNavigationFunc(albumid, previousmediaid);
    } else if (e.key === "ArrowRight" && nextmediaid) {
      mediaNavigationFunc(albumid, nextmediaid);
    } else if (e.key === "Escape") {
      router.replace("./");
    }
  };

  // Prevent reload on media change
  window.onbeforeunload = (e) => {
    if (isMediaChanged.value) {
      e.preventDefault();
    }
  };

  const mediaNavigationFunc = (albumid: number, mediaid: number) => {
    if (!albumid) {
      router.push({ name: "PhotoDetail", params: { mediaid: mediaid } });
    } else {
      router.push({
        name: "AlbumPhotoDetail",
        params: { albumid: albumid, mediaid: mediaid }
      });
    }
    currentmediaid = mediaid;
    previousmediaid = mediaidsSt.getPreviousMediaid(currentmediaid);
    nextmediaid = mediaidsSt.getNextMediaid(currentmediaid);
    toggleSelected("");
    getMediaFileFunc().then(() => {
      refreshCanvasMedia();
    });
  };

  const addToAlbumFunc = async () => {
    // Add media to another album
    if (!media || !media.value) {
      return;
    }
    $("#album-selector-container")[0].showPopover();
  };

  const useAsCoverFunc = async () => {
    // Use the media as the album cover
    setAlbumCover(auth!, albumid, currentmediaid);
  };

  const upscaleFunc = () => {
    // Upscale the photo
    if (!currentBlob.value) {
      return;
    }
    // Create image element
    const img = new Image();
    img.src = URL.createObjectURL(currentBlob.value);
    img.onload = () => {
      upscaleImage(img, canvas.value).then(() => {
        // Enable save button
        isMediaChanged.value = true;
        media.value!.width = canvas.value.width;
        media.value!.height = canvas.value.height;
        canvas.value.toBlob((blob) => {
          if (blob) {
            currentBlob.value = blob;
          }
        });
      });
    };
  };

  const downloadFunc = () => {
    // Download the media
    if (!currentBlob.value || !media.value || !media.value.filename) {
      return;
    }
    $("#download-option")
      .attr("href", URL.createObjectURL(currentBlob.value))
      .attr("download", media.value.filename);
  };

  const deleteMediaFunc = async () => {
    // Delete the media
    await deleteMedia(auth!, { id: currentmediaid }, { id: albumid });
    // Delete the media from the indexedDB
    if (db && db.value) {
      await deleteMediaIndexedDB(db.value, { id: currentmediaid });
    }
    if (!albumid) {
      router.push({ name: "Photos" });
    } else {
      router.push({ name: "AlbumDetail", params: { albumid: albumid } });
    }
  };

  // Extend the window object to declare the cropper object
  declare global {
    interface Window {
      cropper: Cropper;
    }
  }

  const cropFunc = () => {
    // Hide UI elements
    $("#media-options").addClass("hidden");
    $("#media-navigation").addClass("hidden");
    $("#media-dialogs").addClass("hidden");
    $("#crop-dialog").removeClass("hidden");

    const options = {
      viewMode: 2,
      modal: true,
      background: false,
      rotatable: false,
      scalable: false,
      zoomable: false,
      movable: false,
      cropstart: function () {
        // Hide UI elements
        $("#crop-dialog").addClass("hidden");
      },
      cropend: function () {
        // Show save button
        $("#crop-dialog").removeClass("hidden");
      }
    } as object;
    const cropper = new Cropper(canvas.value, options);
    window.cropper = cropper;
  };

  const cropSaveFunc = async () => {
    const cropper = window.cropper as Cropper;
    const cv = cropper.getCroppedCanvas();
    cropper.destroy();
    if (!cv || !media || !media.value || !canvas || !canvas.value) {
      return;
    }

    const blob = await new Promise<Blob>((resolve) => {
      cv.toBlob((blob) => {
        resolve(blob as Blob);
      }, "image/*");
    });

    // Update media properties (needed to keep aspect ratio)
    media.value.file = currentBlob.value = blob;
    media.value.width = cv.width;
    media.value.height = cv.height;
    media.value.mp = Number(((cv.width * cv.height) / 1e6).toPrecision(3));

    $("#crop-dialog").addClass("hidden");
    $("#media-options").removeClass("hidden");
    $("#media-navigation").removeClass("hidden");
    $("#media-dialogs").removeClass("hidden");

    isMediaChanged.value = true;
    currentRotation.value = 0;
    refreshCanvasMedia();
  };

  const cropCancelFunc = () => {
    const cropper = window.cropper as Cropper;
    cropper.destroy();
    $("#crop-dialog").addClass("hidden");
    $("#media-options").removeClass("hidden");
    $("#media-navigation").removeClass("hidden");
    $("#media-dialogs").removeClass("hidden");
  };

  const toggleOverlays = () => {
    // Toggle the overlays visibility when clicking on the media
    if (!selected.value) {
      $("#media-options").toggleClass("hidden-transition");
      $("#media-navigation").toggleClass("hidden-transition");
      $("#media-dialogs").toggleClass("hidden-transition");
    }
  };

  const refreshCanvasMedia = () => {
    if (
      !media ||
      !media.value ||
      !media.value.file ||
      !currentBlob.value ||
      !canvas ||
      !canvas.value
    ) {
      return;
    }

    const ctx = canvas.value.getContext("2d"),
      // Make sure the size of the canvas is the same as the picture
      width = media.value.width,
      height = media.value.height,
      cw = currentRotation.value % 180 == 0 ? width : height,
      ch = currentRotation.value % 180 == 0 ? height : width,
      obj = {
        x: cw / 2,
        y: ch / 2,
        w: width,
        h: height
      };
    if (!ctx) {
      return;
    }
    canvas.value.width = cw;
    canvas.value.height = ch;

    ctx.translate(obj.x, obj.y);
    ctx.rotate((currentRotation.value * Math.PI) / 180);
    ctx.translate(-obj.x, -obj.y);
    // Draw the picture into the canvas
    const img = new Image();
    img.src = URL.createObjectURL(currentBlob.value);
    img.onload = () => {
      // Get image properties
      if (media.value) {
        media.value.width = img.width;
        media.value.height = img.height;
        media.value.mp = Number(
          ((img.width * img.height) / 1e6).toPrecision(3)
        );
      }
      ctx.drawImage(img, obj.x - obj.w / 2, obj.y - obj.h / 2, obj.w, obj.h);
    };
  };

  const rotateLeftFunc = () => {
    // Subtract 90 degrees to the current rotation
    currentRotation.value -= 90;
    if (currentRotation.value === -360) {
      currentRotation.value = 0;
    }
    rotateFunc();
  };

  const rotateRightFunc = () => {
    // Add 90 degrees to the current rotation
    currentRotation.value += 90;
    if (currentRotation.value === 360) {
      currentRotation.value = 0;
    }
    rotateFunc();
  };

  const rotateFunc = () => {
    // Enable save button
    isMediaChanged.value = true;
    refreshCanvasMedia();
  };

  const cancelFunc = () => {
    // Reset state
    currentRotation.value = previousRotation.value;
    if (media.value && previousMedia.value) {
      media.value = Object.assign({}, previousMedia.value);
      currentBlob.value = previousMedia.value.file;
    }
    isMediaChanged.value = false;
    refreshCanvasMedia();
  };

  const updateMediaFunc = async () => {
    // Update the media
    // Get modified image
    const blob: Blob = await new Promise((resolve) => {
      canvas.value.toBlob((blob) => {
        if (!blob) {
          return null;
        }
        resolve(blob);
      });
    });

    if (!blob || !media.value || !canvas.value) {
      return null;
    }

    // Update media properties
    media.value.width = canvas.value.width;
    media.value.height = canvas.value.height;
    media.value.mp = Number(
      ((canvas.value.width * canvas.value.height) / 1e6).toPrecision(3)
    );
    media.value.id = currentmediaid;
    media.value.kind = MediaKinds.IMAGE;
    media.value.file = blob;

    await putMedia(auth!, media.value, { id: albumid });
    // Remove the media in the indexedDB to update it automatically
    if (db && db.value) {
      await deleteMediaIndexedDB(db.value, { id: currentmediaid });
    }

    // Reset state
    // media.value.file = canvas.value.toDataURL();
    isMediaChanged.value = false;
    previousRotation.value = currentRotation.value;
    currentRotation.value = 0;
    previousMedia.value = Object.assign({}, media.value);
  };

  const toggleSelected = (selection: string) => {
    if (selected.value === selection) {
      selected.value = "";
    } else {
      selected.value = selection;
    }

    switch (selected.value) {
      case "edit":
        // Show edit dialog
        $("#edit-dialog").removeClass("hidden");
        $("#edit-option").addClass("color-primary");
        // Hide other dialogs
        $("#details-dialog").addClass("hidden");
        $("#delete-confirmation-dialog").addClass("hidden");
        $("#details-option").removeClass("color-primary");
        $("#delete-option").removeClass("color-primary");
        break;
      case "delete":
        // Show confirmation dialog
        $("#delete-confirmation-dialog").removeClass("hidden");
        $("#delete-option").addClass("color-primary");
        // Hide other dialogs
        $("#details-dialog").addClass("hidden");
        $("#details-option").removeClass("color-primary");
        $("#edit-dialog").addClass("hidden");
        $("#edit-option").removeClass("color-primary");
        break;
      case "details":
        // Show details dialog
        $("#details-dialog").removeClass("hidden");
        $("#details-option").addClass("color-primary");
        // Hide other dialogs
        $("#delete-confirmation-dialog").addClass("hidden");
        $("#delete-option").removeClass("color-primary");
        $("#edit-dialog").addClass("hidden");
        $("#edit-option").removeClass("color-primary");
        break;
      default:
        // Hide all dialogs
        $("#details-dialog").addClass("hidden");
        $("#delete-confirmation-dialog").addClass("hidden");
        $("#details-option").removeClass("color-primary");
        $("#delete-option").removeClass("color-primary");
        $("#edit-dialog").addClass("hidden");
        $("#edit-option").removeClass("color-primary");
    }
  };

  const getMediaInfo = (media: IMediaProperties) => {
    // Wait for the image to load
    return new Promise<IMediaProperties>((resolve, reject) => {
      if (!media.file) {
        return reject(null);
      }

      // Calculate image resolution
      const img = new Image();
      img.src = URL.createObjectURL(media.file);
      img.onload = () => {
        media.width = img.width;
        media.height = img.height;
        media.mp = Number(((media.width * media.height) / 1e6).toPrecision(3));
        resolve(media);
      };
    });
  };

  const getMediaFileFromServer = async () => {
    const data = await getMedia(auth!, { id: currentmediaid }, { id: albumid });
    if (data) {
      return data[0];
    }
    return null;
  };

  const getMediaFileFunc = async () => {
    let m: IMedia | null;
    if (!db || !db.value) {
      console.log("No indexedDB");
      m = await getMediaFileFromServer();
    } else {
      try {
        m = await getMediaPropertiesIndexedDB(db.value, { id: currentmediaid });
        if (!m) {
          m = await getMediaFileFromServer();
        }
        if (!m) {
          throw new Error("No media file found");
        }
      } catch (e) {
        console.error(e);
        m = await getMediaFileFromServer();
      }
    }

    media.value = m as IMediaProperties;
    videoURL.value = URL.createObjectURL(media.value.file!);

    media.value = await getMediaInfo(m as IMediaProperties);
    if (!media) {
      throw new Error("No media data");
    }
    currentBlob.value = media.value.file;
    previousMedia.value = Object.assign({}, media.value);
    refreshCanvasMedia();
  };

  const selected = ref("");
  const videoURL = ref();

  getMediaFileFunc();
</script>

<template>
  <div v-if="media && media.file" id="media-detail">
    <canvas
      v-if="media.kind === MediaKinds.IMAGE"
      id="imageContainer"
      ref="canvas"
      class="fullscreen"
      @click="toggleOverlays"
    />
    <video
      v-else-if="media.kind === MediaKinds.VIDEO"
      id="videoContainer"
      ref="video"
      :src="videoURL"
      class="fullscreen"
      controls
      autoplay
    ></video>
    <!-- Crop confirmation -->
    <div id="crop-dialog" class="dialog-translucent hidden flex flex-row gap-6">
      <md-text-button @click="cropCancelFunc">{{
        $t("cancel")
      }}</md-text-button>
      <md-filled-button @click="cropSaveFunc">
        <md-icon slot="icon">crop</md-icon>
        {{ $t("crop") }}</md-filled-button
      >
    </div>

    <div id="media-navigation">
      <!-- Go to previous page -->
      <a
        id="media-navigation-back"
        class="media-navigation-option dialog-translucent"
        @click="router.replace('./')"
      >
        <md-icon>arrow_back</md-icon>
      </a>
      <!-- Previous media -->
      <a
        v-if="previousmediaid"
        @click="mediaNavigationFunc(albumid, previousmediaid)"
        id="media-navigation-previous"
        class="media-navigation-option dialog-translucent"
      >
        <!-- This icon needs offset as it is not centered -->
        <md-icon class="pl-2">arrow_back_ios</md-icon>
      </a>
      <!-- Next media -->
      <a
        v-if="nextmediaid"
        @click="mediaNavigationFunc(albumid, nextmediaid)"
        id="media-navigation-next"
        class="media-navigation-option dialog-translucent"
      >
        <md-icon>arrow_forward_ios</md-icon>
      </a>
    </div>
    <div id="media-options" class="dialog-translucent flex flex-row gap-4">
      <!-- Download option -->
      <a id="download-option" class="media-option" @click="downloadFunc">
        <md-icon
          :class="{
            'material-symbols-outlined': selected !== 'download',
            'material-symbols-rounded': selected === 'download'
          }"
          >download</md-icon
        >
        <p class="font-primary font-bold">{{ $t("download") }}</p>
      </a>
      <!-- Edit option -->
      <div
        id="edit-option"
        class="media-option"
        @click="toggleSelected('edit')"
      >
        <md-icon
          :class="{
            'material-symbols-outlined': selected !== 'edit',
            'material-symbols-rounded': selected === 'edit'
          }"
          >tune
        </md-icon>
        <p class="font-primary font-bold">{{ $t("edit") }}</p>
      </div>

      <!-- Delete option -->
      <div
        id="delete-option"
        class="media-option"
        @click="toggleSelected('delete')"
      >
        <md-icon
          :class="{
            'material-symbols-outlined': selected !== 'delete',
            'material-symbols-rounded': selected === 'delete'
          }"
          >delete
        </md-icon>
        <p class="font-primary font-bold">{{ $t("delete") }}</p>
      </div>

      <!-- Details option -->
      <div
        id="details-option"
        class="media-option"
        @click="toggleSelected('details')"
      >
        <md-icon
          :class="{
            'material-symbols-outlined': selected !== 'details',
            'material-symbols-rounded': selected === 'details'
          }"
          >info
        </md-icon>
        <p class="font-primary font-bold">{{ $t("details") }}</p>
      </div>
    </div>

    <div id="media-dialogs">
      <!-- Edit dialog -->
      <div
        id="edit-dialog"
        class="media-option-dialog dialog-translucent hidden flex flex-col gap-6"
      >
        <div class="flex flex-col gap-6">
          <!-- Albums options -->
          <div class="flex flex-col gap-3">
            <div class="flex flex-row gap-3 items-center">
              <md-icon class="material-symbols-outlined">collections</md-icon>
              <h4>{{ $t("header.pages.albums") }}</h4>
            </div>
            <div class="flex flex-col w-fit items-start">
              <!-- Add to album option -->
              <AlbumSelector type="add" :mediaid="media.id" />
              <md-text-button @click="addToAlbumFunc">
                <md-icon slot="icon">add</md-icon>
                {{ $t("photos.detail.addToAlbum") }}
              </md-text-button>
              <!-- Use as cover option -->
              <md-text-button
                v-if="albumid && media.kind === MediaKinds.IMAGE"
                @click="useAsCoverFunc"
              >
                <md-icon slot="icon">award_star</md-icon>
                {{ $t("photos.detail.useAsCover") }}
              </md-text-button>
            </div>
          </div>
          <!-- Scale options -->
          <div
            v-if="media.kind === MediaKinds.IMAGE"
            class="flex flex-col gap-3"
          >
            <div class="flex flex-row gap-3 items-center">
              <md-icon class="material-symbols-outlined">fit_screen</md-icon>
              <h4>{{ $t("photos.detail.scale") }}</h4>
            </div>
            <div class="flex flex-col w-fit items-start">
              <md-text-button @click="cropFunc">
                <md-icon slot="icon">crop</md-icon>
                {{ $t("photos.detail.crop") }}
              </md-text-button>
              <!-- Limited because of problems above this resolution -->
              <md-text-button
                @click="upscaleFunc"
                :disabled="media.width * media.height > 362 * 362"
              >
                <md-icon slot="icon">auto_awesome</md-icon>
                {{ $t("photos.detail.upscale") }}
              </md-text-button>
            </div>
          </div>
          <!-- Orientation options -->
          <div
            v-if="media.kind === MediaKinds.IMAGE"
            class="flex flex-col gap-3"
          >
            <div class="flex flex-row gap-3 items-center">
              <md-icon class="material-symbols-outlined">sync</md-icon>
              <h4>{{ $t("photos.detail.orientation") }}</h4>
            </div>
            <div class="flex flex-row gap-1 justify-center">
              <md-text-button @click="rotateLeftFunc">
                <md-icon slot="icon">rotate_left</md-icon>
                {{ $t("photos.detail.rotateLeft") }}
              </md-text-button>
              <md-text-button @click="rotateRightFunc">
                <md-icon slot="icon">rotate_right</md-icon>
                {{ $t("photos.detail.rotateRight") }}
              </md-text-button>
            </div>
          </div>
        </div>
        <div class="flex flex-row justify-evenly">
          <md-text-button :disabled="!isMediaChanged" @click="cancelFunc">{{
            $t("cancel")
          }}</md-text-button>
          <md-filled-button
            :disabled="!isMediaChanged"
            @click="updateMediaFunc"
          >
            <md-icon slot="icon">save</md-icon>
            {{ $t("save") }}
          </md-filled-button>
        </div>
      </div>
      <!-- Delete confirmation dialog -->
      <div
        id="delete-confirmation-dialog"
        class="media-option-dialog dialog-translucent hidden flex flex-col gap-6 text-center"
      >
        <p>{{ $t("photos.detail.deleteConfirmation") }}</p>
        <div class="flex flex-row justify-evenly">
          <md-text-button @click="toggleSelected('delete')">
            <md-icon slot="icon">close</md-icon>
            {{ $t("cancel") }}</md-text-button
          >
          <md-filled-button @click="deleteMediaFunc">
            <md-icon slot="icon">delete</md-icon>
            {{ $t("delete") }}</md-filled-button
          >
        </div>
      </div>
      <!-- Details dialog -->
      <div
        id="details-dialog"
        class="media-option-dialog dialog-translucent hidden flex flex-col gap-6"
      >
        <div class="flex flex-row gap-3 items-center">
          <md-icon class="material-symbols-outlined">image</md-icon>
          <h3>{{ $t("photos.detail.title") }}</h3>
        </div>
        <!-- Name and resolution info -->
        <div v-if="media.filename && media.width && media.height && media.mp">
          <div class="flex flex-row gap-3 items-center mb-2">
            <md-icon class="material-symbols-outlined">article</md-icon>
            <h5>{{ $t("photos.detail.nameResolution") }}</h5>
          </div>
          <p class="font-bold">{{ media.filename }}</p>
          <p class="flex flex-row items-center gap-2 text-secondary">
            {{ media.width + " × " + media.height }}
            <span class="separator-point"></span>
            {{ media.mp + " MP" }}
          </p>
        </div>
        <!-- Date info -->
        <div>
          <div class="flex flex-row gap-3 items-center mb-2">
            <md-icon class="material-symbols-outlined">today</md-icon>
            <h5>{{ $t("photos.detail.date") }}</h5>
          </div>
          <p>
            {{
              intlStringDate(
                media.modificationdate as string,
                "full",
                "short",
                $i18n.locale
              )
            }}
          </p>
        </div>
        <!-- Location info -->
        <div v-if="media.location">
          <div class="flex flex-row gap-3 items-center mb-2">
            <md-icon class="material-symbols-outlined">location_on</md-icon>
            <h5>{{ $t("photos.detail.location") }}</h5>
          </div>
          <p>{{ media.location }}</p>
          <!-- Google maps button -->
          <md-text-button
            class="mt-2"
            :href="`https://maps.google.com/maps?q=${media.coordinates}`"
            target="_blank"
          >
            <md-icon slot="icon">map</md-icon>
            {{ $t("photos.detail.showOnGoogleMaps") }}
          </md-text-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  @import "@css/custom-media.css";

  header {
    display: none;
  }

  @media (--mobile) {
    #media-detail {
      // Media options bottom row
      #media-options {
        bottom: 0;
        top: initial !important;
        left: 0;
        height: 80px;
        width: 100% !important;
        justify-content: space-around;
        padding: 0.5rem;
        border-radius: 30px 30px 0 0 !important;
        border-bottom: none;
      }

      .media-option p {
        display: none;
      }

      .media-option-dialog {
        position: fixed !important;
        width: 90dvw !important;
        top: auto !important;
        bottom: 100px !important;
        margin: 0 auto;
        right: 0 !important;
        left: 0 !important;
      }
    }
  }

  #media-detail {
    /* Backdrop all viewport */
    position: absolute;
    width: 100dvw;
    height: 100dvh;
    top: 0;
    left: 0;
    background: var(--fondo-oscuro);
    z-index: 200;

    .fullscreen {
      width: 100dvw;
      height: 100dvh;
      max-width: 100dvw;
      max-height: 100dvh;
      // Keep aspect ratio
      object-fit: contain;
    }

    // Dialog in the bottom middle
    #crop-dialog {
      position: absolute;
      bottom: -1px;
      left: 50%;
      transform: translateX(-50%);
      padding: 1rem;
      border-radius: 30px 30px 0 0;
    }

    #media-options {
      transition: opacity 0.25s ease-in-out;
      padding: 10px;
      border-radius: 0 0 0 30px;
      width: fit-content;
      /* Set opacity only to background */
      position: absolute;
      top: -1px;
      right: -1px;

      .media-option {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        gap: 0.5rem;
        cursor: pointer;
      }

      .media-option:hover {
        color: var(--md-sys-color-primary);
      }
    }

    .media-option-dialog {
      position: absolute;
      min-width: 275px;
      width: 30vw;
      max-width: 400px;
      height: fit-content;
      top: 75px;
      right: 10px;
      padding: 1rem;
      cursor: initial;
      z-index: 201;
    }

    .media-navigation-option {
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 9999px;
      cursor: pointer;
      width: 48px;
      height: 48px;
      padding: 0.5rem;
      border: 1px solid var(--texto-gris);
    }

    #media-navigation {
      transition: opacity 0.25s ease-in-out;

      #media-navigation-back {
        position: absolute;
        top: 5%;
        left: 5%;
        z-index: 30;
      }

      #media-navigation-next {
        position: absolute;
        top: 50%;
        right: 5%;
        z-index: 30;
      }

      #media-navigation-previous {
        position: absolute;
        top: 50%;
        left: 5%;
        z-index: 30;
      }
    }
  }
</style>
