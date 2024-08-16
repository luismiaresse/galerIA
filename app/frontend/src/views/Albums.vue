<script setup lang="ts">
  import { useI18n } from "vue-i18n";
  import AlbumList from "@/components/albums/AlbumList.vue";

  // Change title
  const $t = useI18n().t;
  document.title = $t("header.pages.albums") + " - galerIA";
</script>

<template>
  <h1>{{ $t("albums.title") }}</h1>
  <AlbumList :allow-creation="true" />
</template>

<style scoped></style>
