<script setup lang="ts">
  import { getAuth } from "@ts/auth";
  import { DEFAULT_ALBUM } from "@ts/constants";
  import { IUserAlbum } from "@ts/definitions";
  import { getMediaIndexedDB, putMediaIndexedDB } from "@ts/indexeddb";
  import { getMedia } from "@ts/requests/media";
  import { inject, Ref, ref } from "vue";
  import { RouterLink } from "vue-router";

  const props = defineProps({
    album: Object as () => IUserAlbum
  });
  const db: Ref<IDBDatabase> | undefined = inject("db");
  const cover = ref();

  if (db && db.value && props.album && props.album.cover) {
    try {
      const media = await getMediaIndexedDB(db.value, {
        id: props.album.cover
      });
      if (media && media[0] && media[0].thumbnail) {
        cover.value = URL.createObjectURL(media[0].thumbnail);
      }
    } catch (e) {
      // Get from server
      const auth = getAuth();
      const media = await getMedia(auth!, { id: props.album.cover });
      if (db && db.value && media && media[0] && media[0].thumbnail) {
        // Put to indexedDB
        await putMediaIndexedDB(db.value, media[0]);
        cover.value = URL.createObjectURL(media[0].thumbnail);
      } else if (media && media[0] && media[0].file) {
        cover.value = URL.createObjectURL(media[0].file);
      }
    }
  }
</script>

<template>
  <RouterLink
    v-if="props.album && props.album.name !== DEFAULT_ALBUM"
    class="text-center"
    :to="{ name: 'AlbumDetail', params: { albumid: props.album.id } }"
  >
    <img
      v-if="props.album.cover"
      class="album-cover"
      :src="cover"
      alt="Album cover"
    />
    <div v-else class="empty-cover" alt="Album cover" />
    <div class="album-info flex flex-col justify-evenly items-center mt-2">
      <h5 class="album-name">{{ props.album.name }}</h5>
      <span class="text-secondary"
        >{{ props.album.elements }} {{ $t("albums.elements") }}</span
      >
    </div>
  </RouterLink>
</template>

<style scoped lang="scss">
  .album-cover,
  .empty-cover {
    width: 200px;
    height: 135px;
    border-radius: 30px;
    object-fit: cover;
    background-color: #2f2f2f;
    transition: transform 0.3s;

    &:hover {
      transform: scale(1.05);
    }
  }

  .album-name {
    width: 200px;
    text-overflow: ellipsis;
    overflow: hidden;
  }
</style>
