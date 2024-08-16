<script setup lang="ts">
  import Album from "@/components/albums/Album.vue";
  import { Ref, ref } from "vue";
  import AlbumCreationPopover from "@/components/albums/AlbumCreationPopover.vue";
  import { getAlbum } from "@ts/requests/album";
  import { IUserAlbum } from "@ts/definitions";
  import { getAuth } from "@ts/auth";

  const albums: Ref<IUserAlbum[]> = ref([]) as Ref<IUserAlbum[]>;

  const props = defineProps<{
    allowCreation: boolean;
    albums?: IUserAlbum[];
  }>();

  const auth = getAuth();

  if (props.albums) {
    albums.value = props.albums;
  } else {
    getAlbum(auth!).then((data) => {
      if (!data) {
        console.error("Error getting albums metadata");
        return;
      }
      albums.value = data;
    });
  }

  const showAlbumCreationDialog = async () => {
    $("#album-creation-popover")[0].showPopover();
  };
</script>

<template>
  <div
    id="albums-container"
    class="mt-4 flex flex-col justify-start items-between"
  >
    <div id="albums-created-container">
      <div
        id="albums-created"
        class="flex flex-row flex-wrap items-baseline justify-start w-fit h-fit gap-4"
      >
        <div
          v-if="props.allowCreation"
          id="albums-create-new"
          class="cursor-pointer text-center"
          @click="showAlbumCreationDialog"
        >
          <img src="@img/albums/create-album.webp" alt="Create new album" />
          <h5 class="mt-2">{{ $t("albums.create") }}</h5>
          <AlbumCreationPopover id="album-creation-popover" />
        </div>
        <Album v-for="a in albums" :album="a" />
        <div
          v-if="albums.length === 0 && !props.allowCreation"
          class="text-center"
        >
          <h3>{{ $t("albums.empty") }}</h3>
        </div>
      </div>
    </div>
    <!-- TODO Disabled until implemented -->
    <div v-if="false" id="albums-generated" class="mt-12">
      <h1>{{ $t("albums.generated") }}</h1>
      <div class="albums-list flex flex-wrap justify-center"></div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  @import "@css/custom-media.css";

  @media (--mobile) {
    #albums-created {
      justify-content: center;
      height: auto;
    }

    #albums-create-new {
      margin: 30px;
    }

    #albums-generated {
      height: auto;
      position: relative;
    }
  }

  #albums-created h2 {
    font-weight: bold;
    font-family: var(--fuente-principal);
  }

  #albums-create-new {
    width: 140px;
    height: 140px;
  }
</style>
