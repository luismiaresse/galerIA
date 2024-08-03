<script setup lang="ts">
  import { getAuth } from "@ts/auth";
  import { useRouter } from "vue-router";
  import { useI18n } from "vue-i18n";
  import AlbumList from "@/components/albums/AlbumList.vue";

  // Change title
  const $t = useI18n().t;
  document.title = $t("header.pages.albums") + " - galerIA";

  const auth = getAuth();
  try {
    if (!auth) {
      const router = useRouter();
      router.push({ name: "Auth" });
      throw new Error("No login token");
    }
  } catch (e) {
    console.error(e);
  }
</script>

<template>
  <h1>{{ $t("albums.title") }}</h1>
  <AlbumList :allow-creation="true" />
</template>

<style scoped></style>
