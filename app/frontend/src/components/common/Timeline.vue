<script setup lang="ts">
  import { getAuth } from "@ts/auth";
  import { Ref, inject, ref } from "vue";
  import { getAlbum, putAlbum } from "@ts/requests/album";
  import { useRoute } from "vue-router";
  import { getDate, getURLFromBlob, intlNumberDate } from "@ts/common";
  import {
    getMediaIndexedDB,
    putMediaIndexedDB,
    deleteMediaIndexedDB
  } from "@ts/indexeddb";
  import { useMediaidsStore } from "@js/stores/mediaids";
  import SearchBox from "./SearchBox.vue";
  import { IAlbum, IMedia } from "@ts/definitions";
  import { useI18n } from "vue-i18n";
  import AlbumDeletionPopover from "@/components/albums/AlbumDeletionPopover.vue";
  import { getMedia } from "@ts/requests/media";
  import {
    ALBUM_NAME_MAX_LENGTH,
    DEFAULT_ALBUM,
    MediaKinds
  } from "@ts/constants";

  const auth = getAuth();
  const props = defineProps<{ type: "default" | "album" }>();
  const type = props.type;
  const media: Ref<IMedia[] | undefined | null> = ref([]);
  const album: Ref<IAlbum> = ref({});
  const groupsByDate: Ref<{ [key: string]: IMedia[] }> = ref({});
  const language = navigator.language || "en-US";

  const editAlbum = ref(false);
  const editAlbumNameField = ref();
  const editedAlbumName = ref("");
  const showDeleteConfirmation = () => {
    $("#album-deletion-popover")[0].showPopover();
  };

  const $t = useI18n().t;
  const mediaidsSt = useMediaidsStore();
  const db: Ref<IDBDatabase> | undefined = inject("db");

  const route = useRoute();
  const albumid = Number(route.params.albumid);
  let albumname;
  if (type === DEFAULT_ALBUM) {
    albumname = DEFAULT_ALBUM;
  }

  album.value.id = albumid;
  album.value.name = albumname;

  const albumMeta = await getAlbum(auth!, album.value);

  if (!albumMeta || albumMeta.length !== 1 || !albumMeta[0].id) {
    throw new Error("No album metadata or more than one album found");
    // TODO Show error message
  }

  album.value = albumMeta[0];
  editedAlbumName.value = album.value.name!;
  album.value.lastupdate = new Date(
    album.value.lastupdate as string
  ).toLocaleDateString();

  // Filter media from the indexedDB
  const filterMedia = async (filter: string) => {
    if (!db || !db.value || !album || !album.value) {
      throw new Error("No indexedDB");
    }
    media.value = await getMediaIndexedDB(
      db.value,
      undefined,
      album.value,
      filter
    );
    groupsByDate.value = groupMediaByDate(media.value!);
  };

  // Gets media modification date and sorts it by date (newest first)
  const groupMediaByDate = (mediaArray: IMedia[]) => {
    const groups: { [key: number]: IMedia[] } = {};

    mediaArray.forEach((media) => {
      const date = getDate(media.modificationdate as string);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(media);
    });

    // Sort keys by date
    const sortedGroups = Object.fromEntries(
      Object.entries(groups).sort((a, b) => Number(b[0]) - Number(a[0]))
    );

    // Get media ids from sorted groups
    const mediaids: Number[] = [];
    for (const key in sortedGroups) {
      for (const mediaItem of sortedGroups[key]) {
        mediaids.push(mediaItem.id as number);
      }
    }

    mediaidsSt.setMediaids(mediaids);

    return sortedGroups;
  };

  const checkAllMediaSameLocation = (mediaArray: IMedia[]) => {
    const location = mediaArray[0].location;
    for (const media of mediaArray) {
      if (media.location !== location || !media.location) {
        return false;
      }
    }
    return true;
  };

  const editAlbumFunc = async () => {
    // Update the album name
    if (album.value.name === editedAlbumName.value) {
      editAlbum.value = false;
      return;
    }

    if (
      !editedAlbumName.value ||
      editedAlbumName.value === "" ||
      editedAlbumName.value === DEFAULT_ALBUM
    ) {
      editAlbumNameField.value.error = true;
      editAlbumNameField.value.errorText = $t("albums.error.invalidName");
      return;
    }

    if (editedAlbumName.value.length > ALBUM_NAME_MAX_LENGTH) {
      editAlbumNameField.value.error = true;
      editAlbumNameField.value.errorText = $t("albums.error.nameLength");
      return;
    }
    editAlbumNameField.value.error = false;

    album.value.name = editedAlbumName.value;
    await putAlbum(auth!, album.value);
    editAlbum.value = false;
  };

  // Checks if the media in album is already in the IndexedDB
  // If not, gets the media from the server
  const refreshMedia = async (db: IDBDatabase, album: IAlbum) => {
    if (!db || !album.id) {
      throw new Error("No indexedDB or album id");
    }
    media.value = [];
    const mediaids: Number[] = [];

    // Data from server
    let data = await getMedia(auth!, undefined, album, true);
    if (!data) data = [];

    // Data from IndexedDB
    let indexedMedia = await getMediaIndexedDB(db, undefined, album);
    if (!indexedMedia) indexedMedia = [];
    console.log(data, indexedMedia);

    // Check if the media in the server is already in the indexedDB
    for (const mediaItem of data) {
      // Store the media id
      mediaids.push(Number(mediaItem.id));
      // Check if the media is not in the indexedDB
      if (!indexedMedia.find((item: IMedia) => item.id === mediaItem.id)) {
        // Get the media file
        const mediaData = await getMedia(auth!, mediaItem, album);

        if (mediaData) {
          await putMediaIndexedDB(db, mediaData[0]);
        }
      }
    }

    // Check if the media in the indexedDB is not in the server
    for (const mediaItem of indexedMedia) {
      if (!data.find((item) => item.id === mediaItem.id)) {
        // Delete the media
        await deleteMediaIndexedDB(db, mediaItem);
      }
    }

    media.value = await getMediaIndexedDB(db, undefined, album);
    // Exclude profile photo
    media.value = media.value?.filter(
      (mediaItem) => mediaItem.kind !== MediaKinds.PROFILE
    );

    // Store the media ids in pinia
    mediaidsSt.setMediaids(mediaids);

    // Group media by date
    if (media.value) groupsByDate.value = groupMediaByDate(media.value);
  };

  const playVideo = async (event: any) => {
    const videoElement = event.target;
    // Need to catch the error because pause can be called before play ends
    try {
      await videoElement.play();
    } catch (error) {}
  };

  const resetVideo = (event: any) => {
    const videoElement = event.target;
    videoElement.currentTime = 0;
    videoElement.pause();
  };

  await refreshMedia(db!.value, album.value);
</script>

<template>
  <div id="timeline" class="pb-36">
    <!-- Photos title -->
    <div
      v-if="type === DEFAULT_ALBUM"
      id="content-title-container"
      class="content-title flex flex-row justify-between"
    >
      <h1>
        {{ $t("photos.title") }}
      </h1>
      <SearchBox @filter="filterMedia" />
    </div>
    <!-- Album info -->
    <div
      v-else-if="type === 'album' && album"
      id="content-title-container"
      class="content-title flex flex-row justify-between"
    >
      <!-- Album deletion confirmation -->
      <AlbumDeletionPopover :albumid="Number(album.id)" />
      <div class="flex flex-row">
        <div id="album-info">
          <h1 v-if="!editAlbum" id="album-title">
            {{ album.name }}
          </h1>
          <md-filled-text-field
            class="w-96 mb-6 font-bold"
            ref="editAlbumNameField"
            v-else
            v-model="editedAlbumName"
            :placeholder="$t('albums.name')"
          />
          <div id="album-subtitle" class="flex flex-row gap-4 items-center">
            <!-- TODO Show shared people -->
            <p v-if="false" class="text-secondary font-secondary">
              {{ $t("albums.detail.sharedWith") }}
              <span class="separator-point"></span>
            </p>
            <p class="text-secondary font-secondary">
              {{ $t("albums.detail.lastUpdate") + album.lastupdate }}
            </p>
            <span class="separator-point"></span>
            <div
              v-if="!editAlbum"
              class="flex flex-row gap-4 items-center"
              @click="console.log(media)"
            >
              <md-text-button @click="editAlbum = true">
                <md-icon slot="icon">edit</md-icon>
                <span>{{ $t("edit") }}</span>
              </md-text-button>
              <md-text-button @click="showDeleteConfirmation">
                <md-icon slot="icon">delete</md-icon>
                <span>{{ $t("delete") }}</span>
              </md-text-button>
            </div>

            <div v-else class="flex flex-row gap-4 items-center">
              <md-text-button @click="editAlbum = false">
                <md-icon slot="icon">close</md-icon>
                <span>{{ $t("cancel") }}</span>
              </md-text-button>
              <md-text-button @click="editAlbumFunc">
                <md-icon slot="icon">save</md-icon>
                <span>{{ $t("save") }}</span>
              </md-text-button>
            </div>
          </div>
        </div>
      </div>
      <SearchBox @filter="filterMedia" />
    </div>
    <div id="photos-container" class="flex flex-col gap-8">
      <div
        class="medias flex flex-row"
        v-for="(media, date) in groupsByDate"
        :key="date"
      >
        <div class="flex flex-col gap-4">
          <div class="font-bold flex flex-row gap-2">
            <p>
              {{ intlNumberDate(date as number, "long", undefined, language) }}
            </p>
            <div
              v-if="checkAllMediaSameLocation(media)"
              class="text-secondary flex flex-row items-center gap-2"
            >
              <span class="separator-point"></span>
              <span>
                {{ media[0].location }}
              </span>
            </div>
          </div>
          <div class="flex flex-row gap-4 flex-wrap">
            <div
              class="media cursor-pointer flex flex-row gap-4"
              v-if="media && media.length !== 0"
              v-for="m in media.slice()"
              :key="m.id"
            >
              <RouterLink
                v-if="type === DEFAULT_ALBUM"
                :to="{ name: 'PhotoDetail', params: { mediaid: m.id } }"
              >
                <img
                  v-if="m.kind === MediaKinds.IMAGE"
                  :src="getURLFromBlob(m.thumbnail)"
                  alt="Media"
                />
                <video
                  v-else
                  :src="getURLFromBlob(m.file)"
                  @mouseenter="playVideo"
                  @mouseleave="resetVideo"
                  muted
                  loop
                />
              </RouterLink>
              <RouterLink
                v-else-if="type === 'album' && album"
                :to="{
                  name: 'AlbumPhotoDetail',
                  params: { albumid: album.id, mediaid: m.id }
                }"
              >
                <img
                  v-if="m.kind === MediaKinds.IMAGE"
                  :src="getURLFromBlob(m.thumbnail)"
                  alt="Media"
                />
                <video
                  v-else
                  :src="getURLFromBlob(m.file)"
                  @mouseenter="playVideo"
                  @mouseleave="resetVideo"
                  muted
                  loop
                />
              </RouterLink>
            </div>
          </div>
        </div>
      </div>
      <div id="timeline-empty" v-if="!media || media.length === 0">
        <h3>{{ $t("photos.empty") }}</h3>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
  @import "@css/custom-media.css";

  @media (--header-break) {
    #content-title-container {
      flex-direction: column;
    }
  }

  .media {
    transition: transform 0.3s;

    img,
    video {
      border-radius: 10px;
      max-width: initial;
      object-fit: cover;
      height: 200px;
    }

    // Add hover effect
    &:hover {
      transform: scale(1.05);
    }
  }

  :root {
    --md-filled-text-field-input-text-size: 32px;
    --md-filled-text-field-input-text-font: var(--fuente-principal);
    --md-filled-text-field-container-color: var(--fondo);
  }
</style>
