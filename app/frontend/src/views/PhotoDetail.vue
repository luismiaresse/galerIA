<script setup lang="ts">
  import { getAuth } from "@ts/auth";
  import { getMedia, deleteMedia, putMedia } from "@ts/requests/media";
  import { Ref, inject, ref } from "vue";
  import { useRoute, useRouter } from "vue-router";
  import { useMediaidsStore } from "@js/stores/mediaids";
  import { intlStringDate, mediaBase64 } from "@ts/common";
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
  if (!auth) {
    router.push({ name: "Auth" });
    throw new Error("No login token");
  }
  const canvas: Ref<HTMLCanvasElement> = ref() as Ref<HTMLCanvasElement>;
  const isChanged = ref(false);

  const db: Ref<IDBDatabase> | undefined = inject("db");
  const mediaidsSt = useMediaidsStore();
  let mediaids: number[] = mediaidsSt.mediaids;
  const albumid = Number(route.params.albumid);
  if (!mediaids || mediaids.length === 0) {
    // Get album metadata
    let album: IAlbum = { id: albumid };
    let albumMeta;
    if (!albumid) {
      albumMeta = await getAlbum(auth);
    } else {
      albumMeta = await getAlbum(auth, album);
    }
    if (!albumMeta) {
      throw new Error("No album metadata");
    }

    album = albumMeta[0];

    // Get mediaids of the album
    const medias = await getMedia(auth, undefined, album.id, true);
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

  // Bind keyboard arrows to navigate through photos
  window.onkeydown = (e) => {
    if (e.key === "ArrowLeft" && previousmediaid) {
      mediaNavigationFunc(albumid, previousmediaid);
    } else if (e.key === "ArrowRight" && nextmediaid) {
      mediaNavigationFunc(albumid, nextmediaid);
    } else if (e.key === "Escape") {
      router.replace("./");
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
    setAlbumCover(auth, albumid, currentmediaid);
  };

  const upscaleFunc = () => {
    // Upscale the photo
    if (!media || !media.value || !media.value.file) {
      return;
    }
    // Create image element
    const img = new Image();
    img.src = media.value.file.toString();
    img.onload = () => {
      upscaleImage(img, canvas.value).then(() => {
        // Enable save button
        isChanged.value = true;
        // draw the image in the canvas
        media.value!.file = canvas.value.toDataURL();
        media.value!.width = canvas.value.width;
        media.value!.height = canvas.value.height;

        refreshCanvasMedia();
      });
    };
  };

  const downloadFunc = () => {
    // Download the photo
    if (!media.value || !media.value.file || !media.value.filename) {
      return;
    }
    $("#download-option")
      .attr("href", media.value.file.toString())
      .attr("download", media.value.filename);
  };

  const deleteMediaFunc = async () => {
    // Delete the photo
    await deleteMedia(auth, currentmediaid, albumid);
    // Delete the media from the indexedDB
    if (db && db.value) {
      await deleteMediaIndexedDB(db.value, currentmediaid);
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
    $("#photo-options").addClass("hidden");
    $("#photo-navigation").addClass("hidden");
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

    const base64 = cv.toDataURL();

    // Update media properties (needed to keep aspect ratio)
    media.value.file = base64;
    media.value.width = cv.width;
    media.value.height = cv.height;
    media.value.mp = Number(((cv.width * cv.height) / 1e6).toPrecision(3));

    $("#crop-dialog").addClass("hidden");
    $("#photo-options").removeClass("hidden");
    $("#photo-navigation").removeClass("hidden");

    isChanged.value = true;
    currentRotation.value = 0;
    refreshCanvasMedia();
  };

  const cropCancelFunc = () => {
    const cropper = window.cropper as Cropper;
    cropper.destroy();
    $("#crop-dialog").addClass("hidden");
    $("#photo-options").removeClass("hidden");
    $("#photo-navigation").removeClass("hidden");
  };

  const toggleOverlays = () => {
    // Toggle the overlays visibility when clicking on the photo
    if (!selected.value) {
      $("#photo-options").toggleClass("hidden-transition");
      $("#photo-navigation").toggleClass("hidden-transition");
    }
  };

  const refreshCanvasMedia = () => {
    if (
      !media ||
      !media.value ||
      !media.value.file ||
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
    // Transform base64 to image
    const img = new Image();
    img.src = media.value.file.toString();
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
    isChanged.value = true;
    refreshCanvasMedia();
  };

  const cancelFunc = () => {
    // Reset state
    currentRotation.value = previousRotation.value;
    if (media.value && previousMedia.value)
      media.value = Object.assign({}, previousMedia.value);
    isChanged.value = false;
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

    await putMedia(auth, media.value, albumid);
    // Remove the media in the indexedDB to update it automatically
    if (db && db.value) {
      await deleteMediaIndexedDB(db.value, currentmediaid);
    }

    // Reset state
    media.value.file = canvas.value.toDataURL();
    isChanged.value = false;
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

  const getMediaInfo = async (media: IMediaProperties) => {
    media.file = (await mediaBase64(media.file!, media.kind)) as string;

    if (!media.file) {
      return;
    }

    // Calculate image resolution
    const img = new Image();
    img.src = media.file.toString();

    // Wait for the image to load
    return new Promise<IMediaProperties>((resolve) => {
      img.onload = () => {
        media.width = img.width;
        media.height = img.height;
        media.mp = Number(((media.width * media.height) / 1e6).toPrecision(3));
        resolve(media);
      };
    });
  };

  const getMediaFileFromServer = async () => {
    const data = await getMedia(auth, currentmediaid, albumid);
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
        m = await getMediaPropertiesIndexedDB(db.value, currentmediaid);
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

    return new Promise<void>((resolve) => {
      getMediaInfo(m as IMediaProperties).then((data) => {
        if (!data) {
          throw new Error("No media data");
        }
        media.value = data;
        previousMedia.value = Object.assign({}, media.value);

        refreshCanvasMedia();
        resolve();
      });
    });
  };

  getMediaFileFunc().then(() => {
    const cv = document.getElementById("photo") as HTMLCanvasElement;
    canvas.value = cv;
    refreshCanvasMedia();
  });
  const selected = ref("");
</script>

<template>
  <div v-if="media && media.file" id="photo-detail">
    <canvas
      v-if="media.kind === MediaKinds.IMAGE"
      id="photo"
      ref="photo"
      @click="toggleOverlays"
    />
    <video
      v-else-if="media.kind === MediaKinds.VIDEO"
      id="photo"
      ref="photo"
      :src="media.file as string"
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

    <div id="photo-navigation">
      <!-- Go to previous page -->
      <a
        id="photo-navigation-back"
        class="photo-navigation-option dialog-translucent"
        @click="router.replace('./')"
      >
        <md-icon>arrow_back</md-icon>
      </a>
      <!-- Previous photo -->
      <a
        v-if="previousmediaid"
        @click="mediaNavigationFunc(albumid, previousmediaid)"
        id="photo-navigation-previous"
        class="photo-navigation-option dialog-translucent"
      >
        <!-- This icon needs offset as it is not centered -->
        <md-icon class="pl-2">arrow_back_ios</md-icon>
      </a>
      <!-- Next photo -->
      <a
        v-if="nextmediaid"
        @click="mediaNavigationFunc(albumid, nextmediaid)"
        id="photo-navigation-next"
        class="photo-navigation-option dialog-translucent"
      >
        <md-icon>arrow_forward_ios</md-icon>
      </a>
    </div>
    <div id="photo-options" class="dialog-translucent flex flex-row gap-4">
      <!-- Download option -->
      <a id="download-option" class="photo-option" @click="downloadFunc">
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
        class="photo-option"
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
      <!-- Edit dialog -->
      <div
        id="edit-dialog"
        class="photo-option-dialog dialog-translucent hidden flex flex-col gap-6"
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
              <md-text-button v-if="albumid" @click="useAsCoverFunc">
                <md-icon slot="icon">award_star</md-icon>
                {{ $t("photos.detail.useAsCover") }}
              </md-text-button>
            </div>
          </div>
          <!-- Scale options -->
          <div class="flex flex-col gap-3">
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
          <div class="flex flex-col gap-3">
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
          <md-text-button :disabled="!isChanged" @click="cancelFunc">{{
            $t("cancel")
          }}</md-text-button>
          <md-filled-button :disabled="!isChanged" @click="updateMediaFunc">
            <md-icon slot="icon">save</md-icon>
            {{ $t("save") }}
          </md-filled-button>
        </div>
      </div>

      <!-- Delete option -->
      <div
        id="delete-option"
        class="photo-option"
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

      <!-- Delete confirmation dialog -->
      <div
        id="delete-confirmation-dialog"
        class="photo-option-dialog dialog-translucent hidden flex flex-col gap-6 text-center"
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

      <!-- Details option -->
      <div
        id="details-option"
        class="photo-option"
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
      <!-- Details dialog -->
      <div
        id="details-dialog"
        class="photo-option-dialog dialog-translucent hidden flex flex-col gap-6"
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
    #photo-detail {
      // Photo options bottom row
      #photo-options {
        bottom: 0;
        top: initial !important;
        left: 0;
        height: 80px;
        width: 100% !important;
        justify-content: space-around;
        padding: 0.5rem;
        border-radius: 30px 30px 0 0 !important;
        border-bottom: none;

        .photo-option p {
          display: none;
        }

        .photo-option-dialog {
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
  }

  #photo-detail {
    /* Backdrop all viewport */
    position: absolute;
    width: 100dvw;
    height: 100dvh;
    top: 0;
    left: 0;
    background: var(--fondo-oscuro);
    z-index: 200;

    #photo {
      width: 100dvw;
      height: 100dvh;
      max-width: 100dvw;
      max-height: 100dvh;
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

    #photo-options {
      transition: opacity 0.25s ease-in-out;
      padding: 10px;
      border-radius: 0 0 0 30px;
      width: fit-content;
      /* Set opacity only to background */
      position: absolute;
      top: -1px;
      right: -1px;

      .photo-option {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        padding: 0.5rem;
        gap: 0.5rem;
        cursor: pointer;
      }

      .photo-option:hover {
        color: var(--md-sys-color-primary);
      }

      .photo-option-dialog {
        position: absolute;
        min-width: 275px;
        width: 30vw;
        max-width: 400px;
        height: fit-content;
        top: 80px;
        right: 10px;
        padding: 1rem;
        cursor: initial;
        z-index: 201;
      }
    }

    .photo-navigation-option {
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

    #photo-navigation {
      transition: opacity 0.25s ease-in-out;

      #photo-navigation-back {
        position: absolute;
        top: 5%;
        left: 5%;
        z-index: 30;
      }

      #photo-navigation-next {
        position: absolute;
        top: 50%;
        right: 5%;
        z-index: 30;
      }

      #photo-navigation-previous {
        position: absolute;
        top: 50%;
        left: 5%;
        z-index: 30;
      }
    }
  }
</style>
