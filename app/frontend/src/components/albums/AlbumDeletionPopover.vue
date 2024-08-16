<script setup lang="ts">
  import { getAuth } from "@ts/auth";
  import { useRouter } from "vue-router";
  import { deleteAlbum } from "@ts/requests/album";
  import { IAlbum } from "@ts/definitions";

  const props = defineProps<{
    albumid: number;
  }>();
  const router = useRouter();

  const closePopover = () => {
    $("#album-deletion-popover")[0].hidePopover();
  };

  const deleteAlbumFunc = async () => {
    const auth = getAuth();
    await deleteAlbum(auth!, { id: props.albumid } as IAlbum);
    router.push({ name: "Albums" });
  };
</script>

<template>
  <div id="album-deletion-popover" popover class="dialog">
    <h1>{{ $t("albums.delete") }}</h1>
    <p>{{ $t("albums.deleteConfirmation") }}</p>
    <div class="flex flex-row mt-8 gap-6 justify-center">
      <md-outlined-button @click="closePopover">
        <md-icon slot="icon">close</md-icon>
        {{ $t("cancel") }}
      </md-outlined-button>
      <md-filled-button @click="deleteAlbumFunc">
        <md-icon slot="icon">delete</md-icon>
        {{ $t("albums.delete") }}
      </md-filled-button>
    </div>
  </div>
</template>

<style scoped lang="scss">
  #album-deletion-popover {
    min-width: 300px;
    width: 90%;
    max-width: 500px;
    text-align: center;
    position: absolute;
    /* Center the popover */
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: var(--fondo-oscuro);
    padding: 20px 50px 30px 50px;
  }

  #album-deletion-popover::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }
</style>
