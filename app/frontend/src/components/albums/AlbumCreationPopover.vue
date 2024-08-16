<script setup lang="ts">
  import { getAuth } from "@ts/auth";
  import { ref } from "vue";
  import { useRouter } from "vue-router";
  import { putAlbum } from "@ts/requests/album";
  import { useI18n } from "vue-i18n";
  import { IAlbum } from "@ts/definitions";
  import { DEFAULT_ALBUM } from "@ts/constants";
  const auth = getAuth();
  const name = ref("");
  const nameField = ref();
  const router = useRouter();
  const $t = useI18n().t;

  const createAlbumFunc = async () => {
    if (name.value === DEFAULT_ALBUM) {
      console.error("Invalid album name");
      nameField.value.error = true;
      nameField.value.errorText = $t("albums.error.invalidName");
      return;
    }
    // Create the album and get its id
    let album: IAlbum = {
      name: name.value
    };

    album = (await putAlbum(auth!, album)) as IAlbum;
    if (!album.id) {
      console.error("Error creating album");
      nameField.value.error = true;
      nameField.value.errorText = $t("albums.error.create");
      return;
    }
    // Redirect to the new album
    router.push({ name: "AlbumDetail", params: { albumid: album.id } });
  };
</script>

<template>
  <div id="album-creation-popover" popover class="dialog">
    <h1>{{ $t("albums.create") }}</h1>
    <form class="flex flex-col mt-8 gap-6" @submit.prevent="createAlbumFunc">
      <md-outlined-text-field
        id="album-text-field"
        required
        v-model="name"
        :label="$t('albums.name')"
        ref="nameField"
      />
      <md-filled-button>
        <md-icon slot="icon">add</md-icon>
        {{ $t("_create") }}
      </md-filled-button>
    </form>
  </div>
</template>

<style scoped>
  #album-creation-popover {
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

  #album-creation-popover::backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }
</style>
