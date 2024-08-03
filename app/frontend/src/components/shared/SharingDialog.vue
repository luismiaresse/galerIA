<script setup lang="ts">
  import { getAuth } from "@ts/auth";
  import { mediaBase64 } from "@ts/common";
  import { MediaKinds } from "@ts/constants";
  import { IAlbum } from "@ts/definitions";
  import { getSharedAlbumFromCode } from "@ts/requests/album";
  import { ref } from "vue";

  const auth = getAuth();

  const sharingContainer = ref({ collapsed: true });
  const toggleSharing = () => {
    sharingContainer.value.collapsed = !sharingContainer.value.collapsed;
  };
  const codeInput = ref("");

  const showAlbumSelector = () => {
    $("#album-selector-container")[0].showPopover();
  };

  const getSharedAlbumFunc = () => {
    if (!codeInput || !codeInput.value) {
      console.error("Empty code");
      return;
    }

    const share: IAlbum = {
      code: codeInput.value
    };

    getSharedAlbumFromCode(auth!, share).then((data) => {
      if (!data) {
        console.error("Error getting shared album");
        return;
      }
      mediaBase64(data.cover!, MediaKinds.IMAGE).then((cover) => {
        data.cover = cover!;
      });

      emit("new-shared-album", data);
    });
  };

  const emit = defineEmits(["new-shared-album"]);
</script>

<template>
  <div
    id="sharing-container-expanded"
    v-if="!sharingContainer.collapsed"
    class="flex flex-col items-center justify-center absolute text-center p-5 right-7 w-full"
  >
    <div
      id="sharing-select"
      class="flex flex-row items-center justify-evenly w-full"
    >
      <h4 class="text-primary">{{ $t("shared.codes.shareAlbum") }}</h4>
      <md-filled-tonal-button @click="showAlbumSelector">{{
        $t("select")
      }}</md-filled-tonal-button>
    </div>
    <hr class="separator" />
    <div id="sharing-code" class="flex flex-col w-full">
      <h4 class="text-primary mt-3 mb-3">{{ $t("shared.codes.enter") }}</h4>
      <form
        @submit.prevent="getSharedAlbumFunc"
        id="sharing-code-input"
        class="flex flex-row items-center justify-evenly w-full gap-2"
      >
        <md-outlined-text-field
          class="w-2/3"
          :label="$t('shared.codes.codeInput')"
          v-model="codeInput"
        />
        <md-filled-button type="submit"
          >{{ $t("add") }}
          <md-icon slot="icon">add</md-icon>
        </md-filled-button>
      </form>
    </div>
    <!-- Collapse button -->
    <md-icon class="cursor-pointer mt-4 -mb-1" @click="toggleSharing()"
      >expand_less</md-icon
    >
  </div>
  <div
    id="sharing-container-collapsed"
    @click="toggleSharing()"
    v-else
    class="flex flex-row items-center justify-center absolute text-center p-5 right-7 top-30 w-full ml-auto gap-3 cursor-pointer"
  >
    <md-icon>expand_content</md-icon>
    <p class="font-primary font-bold">{{ $t("shared.codes.share") }}</p>
  </div>
</template>

<style scoped lang="scss">
  @import "@css/custom-media.css";

  @media (--header-break) {
    #sharing-container-expanded {
      position: inherit;
      margin: 0 auto 30px auto;
    }

    #sharing-container-collapsed {
      position: inherit;
      margin: 0 auto 30px auto;
    }
  }

  @media (--mobile-l) {
    #sharing-container-expanded {
      #sharing-code-input {
        flex-direction: column;

        md-filled-button {
          margin-top: 15px;
        }
      }
    }
  }

  @media (--mobile-s) {
    #sharing-container-expanded {
      #sharing-select {
        flex-direction: column;
      }
    }
  }

  #sharing-container {
    #sharing-container-expanded {
      background: var(--fondo-oscuro);
      border-radius: 30px;
      border: 1px solid var(--texto-gris);
      max-width: 400px;
    }

    #sharing-container-collapsed {
      background: var(--fondo-oscuro);
      border-radius: 30px;
      border: 1px solid var(--texto-gris);
      max-width: fit-content;
      max-height: 50px;
    }
  }
</style>
