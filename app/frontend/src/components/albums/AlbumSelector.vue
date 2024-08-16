<script setup lang="ts">
  import { getAuth } from "@ts/auth";
  import { MediaKinds, SharePermissionKinds } from "@ts/constants";
  import { IAlbum, IMedia, IUserAlbum } from "@ts/definitions";
  import { getAlbum, shareAlbum } from "@ts/requests/album";
  import { putMedia } from "@ts/requests/media";
  import { Ref, ref } from "vue";
  import { useI18n } from "vue-i18n";

  const props = defineProps<{
    type: "share" | "add";
    mediaid?: number;
    media?: Blob[];
  }>();

  const auth = getAuth();
  const albums: Ref<IUserAlbum[]> = ref([]);
  const selectedAlbum: Ref<IUserAlbum | null> = ref(null);
  const selectionError = ref();
  const selectedPermission = ref(SharePermissionKinds.FULL_ACCESS);
  const sharedalbum: Ref<IAlbum | undefined> = ref();
  const copiedText = ref();

  const $t = useI18n().t;

  // Get user albums to select
  getAlbum(auth!).then((data) => {
    if (data) albums.value = data;
  });

  const hidePopover = () => {
    $("#album-selector-container")[0].hidePopover();
  };

  const albumSelectedFunc = (album: IUserAlbum) => {
    selectedAlbum.value = album;
  };

  const togglePermission = (permission: SharePermissionKinds) => {
    if (selectedPermission.value === permission) {
      selectedPermission.value = SharePermissionKinds.FULL_ACCESS;
    } else {
      selectedPermission.value = permission;
    }
  };

  const albumSelectAcceptFunc = async () => {
    if (selectedAlbum.value) {
      selectedAlbum.value.permissions = selectedPermission.value;
      switch (props.type) {
        case "share":
          await shareAlbumFunc();
          break;
        case "add":
          await addMediaToAlbum();
          break;
      }
    } else {
      selectionError.value.innerHTML = $t("albums.error.noSelection");
    }
  };

  const shareAlbumFunc = async () => {
    await shareAlbum(auth!, selectedAlbum.value!).then((shared) => {
      if (shared) {
        selectionError.value.innerHTML = "";
        sharedalbum.value = shared;
      } else {
        console.error("Error creating share");
        selectionError.value.innerHTML = $t("shared.error.createShare");
      }
    });
  };

  const copyCodeFunc = () => {
    if (!sharedalbum.value || !sharedalbum.value.code) return;
    navigator.clipboard.writeText(sharedalbum.value.code);
    copiedText.value.classList.remove("hidden");
  };

  const resetState = () => {
    selectedPermission.value = SharePermissionKinds.FULL_ACCESS;
    sharedalbum.value = undefined;
    hidePopover();
  };

  const addMediaToAlbum = async () => {
    if (
      (!props.mediaid && (!props.media || props.media.length === 0)) ||
      !selectedAlbum.value
    ) {
      console.error("Error adding media to album");
      return;
    }
    if (props.mediaid) {
      await addMediaToAlbumById();
    } else {
      await addMediaToAlbumByArray();
    }
    // Hide popover
    hidePopover();
  };

  const addMediaToAlbumById = async () => {
    putMedia(auth!, { id: props.mediaid }, selectedAlbum.value!).then(
      (media) => {
        if (media) {
          console.log("Media added to album");
        } else {
          console.error("Error adding media to album");
        }
      }
    );
  };

  const addMediaToAlbumByArray = async () => {
    for (const m of props.media!) {
      console.log(m, props.media);
      console.log("Selected album", selectedAlbum.value!);

      const mediaPut: IMedia = {
        file: m,
        kind: MediaKinds.IMAGE
      };
      putMedia(auth!, mediaPut, selectedAlbum.value!).then((med) => {
        if (med) {
          console.log("Media added to album");
        } else {
          console.error("Error adding media to album");
        }
      });
    }
  };
</script>

<template>
  <div id="album-selector-container" popover>
    <div
      id="album-selector"
      class="dialog fixed flex flex-col justify-center p-6 gap-2"
    >
      <h3 class="mb-4">{{ $t("albums.select") }}</h3>
      <div
        role="radiogroup"
        @click="albumSelectedFunc(album)"
        class="album-option dialog cursor-pointer mt-1 flex flex-row items-center"
        v-if="albums"
        v-for="album in albums"
      >
        <md-radio
          class="ml-4"
          name="albums"
          :id="'album-radio-' + album.id"
          :value="album.id"
        >
        </md-radio>
        <label
          :for="'album-radio-' + album.id"
          class="p-4 w-full cursor-pointer font-bold"
          >{{ album.name }}</label
        >
      </div>
      <div v-else>
        <p>{{ $t("albums.empty") }}</p>
      </div>
      <p ref="selectionError" class="error"></p>
      <!-- Permission select chips -->
      <div
        v-if="type === 'share'"
        class="flex flex-col justify-center mt-4 gap-4 mb-4"
      >
        <div class="flex flex-row items-center gap-2">
          <md-icon class="material-symbols-outlined">lock</md-icon>
          <p class="font-bold">{{ $t("shared.permissionLevel") }}</p>
        </div>
        <md-chip-set class="flex flex-row gap-4 justify-center">
          <md-filter-chip
            disabled
            :selected="selectedPermission === SharePermissionKinds.READ_ONLY"
            :label="$t('shared.readOnly')"
            @click="togglePermission(SharePermissionKinds.READ_ONLY)"
            ref="chipLowRes"
          ></md-filter-chip>
          <md-filter-chip
            disabled
            :selected="selectedPermission === SharePermissionKinds.READ_WRITE"
            :label="$t('shared.readWrite')"
            @click="togglePermission(SharePermissionKinds.READ_WRITE)"
            ref="chipDefaultRes"
          ></md-filter-chip>
          <md-filter-chip
            :selected="selectedPermission === SharePermissionKinds.FULL_ACCESS"
            :label="$t('shared.fullAccess')"
            @click="togglePermission(SharePermissionKinds.FULL_ACCESS)"
            ref="chipHighRes"
          ></md-filter-chip>
        </md-chip-set>
      </div>
      <div
        id="sharing-code"
        v-if="sharedalbum && sharedalbum.code"
        class="flex flex-col items-center"
      >
        <div class="success flex flex-row gap-2">
          <md-icon>check</md-icon>
          <p>{{ $t("shared.success.createShare") }}</p>
        </div>
        <div class="text-primary mt-3 mb-3 text-center w-52 p-4">
          <h5>{{ $t("shared.codes.codeInput") }}</h5>
          <div class="flex flex-row items-center justify-center gap-4">
            <h2 class="color-primary mt-3">
              {{ sharedalbum.code }}
            </h2>
            <md-icon
              class="mt-3 color-primary cursor-pointer material-symbols-outlined"
              @click="copyCodeFunc"
              >content_copy</md-icon
            >
          </div>
          <p ref="copiedText" class="hidden mt-4">
            {{ $t("shared.codes.copied") }}
          </p>
        </div>
      </div>
      <div class="flex flex-row justify-center gap-8">
        <md-outlined-button @click="resetState">
          <md-icon slot="icon">close</md-icon>
          {{ $t("cancel") }}
        </md-outlined-button>
        <md-filled-button
          :disabled="!selectedAlbum"
          @click="albumSelectAcceptFunc"
        >
          <md-icon slot="icon">check</md-icon>
          {{ $t("select") }}
        </md-filled-button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  #album-selector-container {
    background: var(--fondo-oscuro);
    z-index: 300;

    &::backdrop {
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(3px);
    }

    #album-selector {
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      max-width: 500px;
      min-width: 300px;

      .album-option {
        background-color: var(--background);
        border-radius: 10px;
        transition: background-color 0.3s;

        &:hover {
          background-color: var(--fondo);
        }
      }
    }
  }
</style>
