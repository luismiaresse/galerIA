<script setup lang="ts">
  import { RouterLink } from "vue-router";

  const props = defineProps({
    album: Object
  });
</script>

<template>
  <RouterLink
    v-if="props.album"
    class="text-center"
    :to="{ name: 'AlbumDetail', params: { albumid: props.album.id } }"
  >
    <img
      v-if="props.album.cover"
      class="album-cover"
      :src="props.album.cover"
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
