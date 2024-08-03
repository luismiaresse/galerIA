<script setup lang="ts">
  import AlbumList from "@/components/albums/AlbumList.vue";
  import AlbumSelector from "@/components/albums/AlbumSelector.vue";
  import SharingDialog from "@/components/shared/SharingDialog.vue";
  import { getAuth } from "@ts/auth";
  import { IUserAlbum } from "@ts/definitions";
  import { getAlbum } from "@ts/requests/album";
  import { ref } from "vue";
  import { useI18n } from "vue-i18n";
  import { useRouter } from "vue-router";

  const auth = getAuth();
  if (!auth) {
    const router = useRouter();
    router.push({ name: "Auth" });
  }

  // Change title
  const $t = useI18n().t;
  document.title = $t("header.pages.shared") + " - galerIA";

  const sharedAlbums = ref<IUserAlbum[]>([]);
  const sharedWithOthers = ref<IUserAlbum[]>([]);
  const loadedSharedAlbums = ref(false);
  const loadedSharedWithOthers = ref(false);
  const sharedOwnOpts: IUserAlbum = {
    sharedOwned: true
  };

  const sharedOthersOpts: IUserAlbum = {
    shared: true
  };

  getAlbum(auth!, sharedOthersOpts).then((data) => {
    if (!data) {
      console.error("Error getting shared albums metadata");
      return;
    }
    sharedAlbums.value = data;
    loadedSharedAlbums.value = true;
  });

  getAlbum(auth!, sharedOwnOpts).then((data) => {
    if (!data) {
      console.error("Error getting shared albums metadata");
      return;
    }
    sharedWithOthers.value = data;
    loadedSharedWithOthers.value = true;
  });

  const appendNewSharedAlbumFunc = (album: IUserAlbum) => {
    sharedAlbums.value.push(album);
  };
</script>

<template>
  <div id="sharing-container">
    <AlbumSelector type="share" />
    <SharingDialog @new-shared-album="appendNewSharedAlbumFunc" />
  </div>
  <div
    id="sharing-content"
    class="flex flex-col justify-evenly h-full items-start"
  >
    <div id="sharing-you" class="h-1/2 w-full">
      <h1>{{ $t("shared.title") }}</h1>
      <AlbumList
        :albums="sharedAlbums"
        :allow-creation="false"
        :key="String(loadedSharedAlbums)"
      />
    </div>
    <div id="sharing-others" class="h-1/2 w-full">
      <h1>{{ $t("shared.others") }}</h1>
      <AlbumList
        :albums="sharedWithOthers"
        :allow-creation="false"
        :key="String(loadedSharedWithOthers)"
      />
    </div>
  </div>
</template>

<style scoped lang="scss"></style>
