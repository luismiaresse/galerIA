<!-- TODO Deselecting default chips makes no selection -->
<script setup>
  import FirstTimeDialog from "@/components/create/FirstTimeDialog.vue";
  import AlbumSelector from "@/components/albums/AlbumSelector.vue";
  import { initSDTurbo, generateSDTurbo } from "@js/sd-turbo/sd-turbo.js";
  import { onMounted, ref } from "vue";
  import { triggerReload } from "@ts/common";
  import { LOCALSTORAGE_DEVICE_INFO } from "@ts/constants";
  import { useI18n } from "vue-i18n";
  import { onBeforeRouteLeave } from "vue-router";

  // Change title
  const $t = useI18n().t;
  document.title = $t("header.pages.create") + " - galerIA";

  const generatedMedia = ref([]);

  // Option refs
  const chipLowRes = ref(null);
  const chipDefaultRes = ref(null);
  const chipHighRes = ref(null);
  const chipVeryHighRes = ref(null);

  // Constants
  // Image resolutions: width (px), height (px), memory required (GiB)
  const RESOLUTION_LOW = {
    option: chipLowRes,
    value: "low",
    width: 192,
    height: 192,
    // Using a lower resolution makes really bad quality images
    memoryRequired: 3.3
  };
  const RESOLUTION_DEFAULT = {
    option: chipDefaultRes,
    value: "default",
    width: 256,
    height: 256,
    memoryRequired: 3.6
  };
  const RESOLUTION_HIGH = {
    option: chipHighRes,
    value: "high",
    width: 512,
    height: 512,
    memoryRequired: 6.5
  };
  const RESOLUTION_VERY_HIGH = {
    option: chipVeryHighRes,
    value: "veryHigh",
    width: 768,
    height: 768,
    memoryRequired: 15.0
    // Value way too close to crash in 16GiB GPUs if another application takes memory,
    // might have to display warning
  };
  const resolutionOptions = [
    RESOLUTION_LOW,
    RESOLUTION_DEFAULT,
    RESOLUTION_HIGH,
    RESOLUTION_VERY_HIGH
  ];

  let deviceInfo, ramAmount, vramAmount;

  // Generation parameters
  const params = ref({
    fileType: "image",
    imageNumber: 1,
    resolution: {
      value: "default",
      customWidth: 256,
      customHeight: 256,
      maxValue: 1024,
      minValue: 128
    },
    quality: {
      value: "default",
      customValue: 4,
      maxValue: 50,
      minValue: 1
    },
    model: "sd-turbo"
  });
  // Prompt text
  const prompt = ref("");
  // Variables set after generation
  const state = ref({
    loading: false,
    loaded: false,
    generating: false,
    generated: false,
    imageCount: 1,
    resolution: undefined,
    // Resolution change requires reloading model
    resolutionChanged: false,
    // Experimental flag to test memory usage
    unloadAfterGeneration: false
  });
  // State from previous generation to check if model needs to be reloaded
  const lastState = ref();

  // Toggles showing first time dialog
  const firsttime = ref(true);

  const disableIncompatibleSettings = (ramAmount, vramAmount) => {
    // Disable gen params that require more memory than the device has
    for (const res of resolutionOptions) {
      if (res.memoryRequired > ramAmount || res.memoryRequired > vramAmount) {
        res.option.value.disabled = true;
      }
    }
  };

  const checkFirstTime = () => {
    // Check if it is the first time the user enters the page
    if (localStorage.getItem(LOCALSTORAGE_DEVICE_INFO)) {
      firsttime.value = false;
      deviceInfo = JSON.parse(localStorage.getItem(LOCALSTORAGE_DEVICE_INFO));
      ramAmount = deviceInfo ? deviceInfo.ram : undefined;
      vramAmount = deviceInfo ? deviceInfo.vram : undefined;
      if (ramAmount && vramAmount) {
        disableIncompatibleSettings(ramAmount, vramAmount);
      }
    }
    // Prevent scrolling
    $("#app").css("overflow-y", "hidden");
  };

  // Restore scrolling
  onBeforeRouteLeave(() => {
    $("#app").css("overflow-y", "unset");
  });

  const toggleFileType = (value) => {
    if (params.value.fileType === value) {
      params.value.fileType = "image";
    } else {
      params.value.fileType = value;
    }
    if (params.value.fileType === "video") {
      params.value.imageNumber = 1;
    }
  };
  const toggleResolution = (value) => {
    if (params.value.resolution.value === value) {
      params.value.resolution.value = "default";
    } else {
      params.value.resolution.value = value;
    }
    // Reset loaded state (model needs to be reloaded)
    state.value.loaded = false;
  };
  const toggleQuality = (value) => {
    if (params.value.quality.value === value) {
      params.value.quality.value = "default";
    } else {
      params.value.quality.value = value;
    }
  };
  const toggleModel = (e, value) => {
    // Avoids toggling model when clicking on preload
    if (e.target.tagName === "MD-FILTER-CHIP") {
      if (params.value.model === value) {
        params.value.model = "sd-turbo";
      } else {
        params.value.model = value;
      }
    } else if (e.target.tagName === "MD-TEXT-BUTTON") {
      loadAndGenerate(false);
    }
  };
  const resizePrompt = () => {
    const textarea = document.getElementById("prompt");
    textarea.style.height = "auto";
    // New height is the scroll height + 4px (avoids scroll bar)
    textarea.style.height = `${textarea.scrollHeight + 4}px`;
  };
  const loadAndGenerate = async (generate = true) => {
    // Update state to selected parameters
    generatedMedia.value = [];
    state.value.loading = true;
    state.value.imageCount = params.value.imageNumber;
    switch (params.value.resolution.value) {
      case "low":
        state.value.resolution = RESOLUTION_LOW;
        break;
      case "default":
        state.value.resolution = RESOLUTION_DEFAULT;
        break;
      case "high":
        state.value.resolution = RESOLUTION_HIGH;
        break;
      case "veryHigh":
        state.value.resolution = RESOLUTION_VERY_HIGH;
        break;
      case "custom":
        state.value.resolution = {
          value: "custom",
          width: params.value.resolution.customWidth,
          height: params.value.resolution.customHeight,
          memoryRequired: undefined
        };
        break;
    }

    const generatedConts = document.getElementsByClassName(
      "generation-container"
    );
    // add hidden class to all generated containers
    // for (const cont of generatedConts) {
    //   cont.classList.add("hidden");
    // }

    $("#create-generated").css("grid-template-columns", "repeat(1, 1fr)");
    $("#create-generated img").css({
      "border-radius": "1rem",
      margin: "0.5rem"
    });

    const lastWidth = lastState.value
      ? lastState.value.resolution.width
      : undefined;
    const lastHeight = lastState.value
      ? lastState.value.resolution.height
      : undefined;
    const width = state.value.resolution.width;
    const height = state.value.resolution.height;
    state.value.resolutionChanged =
      lastWidth !== width || lastHeight !== height;

    console.log("Generating image(s) with prompt:", prompt.value);
    console.log("Generating image(s) with parameters:", params.value);
    console.log("Generating image(s) with state:", state.value);

    switch (params.value.model) {
      case "sd-turbo":
        await initSDTurbo(state.value);
        state.value.loaded = true;
        state.value.loading = false;
        state.value.generated = false;
        // Copy state to lastState
        lastState.value = Object.assign({}, state.value);
        lastState.value.resolution = Object.assign({}, state.value.resolution);
        if (generate) {
          state.value.generating = true;
          // Clean previous generated images
          // $(".generation-container").remove();
          await generateSDTurbo(prompt.value, state.value, $t);
          // Save generated images into media
          for (let i = 0; i < state.value.imageCount; i++) {
            const canvas = document.getElementById(`create-canvas-${i}`);
            const img = canvas.toDataURL("image/*");
            generatedMedia.value.push(img);
          }
          state.value.generating = false;
          state.value.generated = true;
        }
        break;
      default:
        break;
    }

    if (state.value.imageCount > 1) {
      $("#create-generated").css(
        "grid-template-columns",
        `repeat(${Math.ceil(state.value.imageCount / 3)}, 1fr)`
      );
      // Update image sizes
      $("#create-generated img").css({
        "border-radius": "0",
        margin: "0"
      });
    }
  };

  const addToAlbumFunc = async () => {
    // Add media to another album
    if (!generatedMedia || !generatedMedia.value) {
      return;
    }
    $("#album-selector-container")[0].showPopover();
  };

  onMounted(() => {
    checkFirstTime();

    // Bind enter key to submit prompt
    $("#prompt").on("keydown", (e) => {
      if (e.key === "Enter") {
        loadAndGenerate(true);
        e.preventDefault();
      }
    });
  });
</script>

<template>
  <div id="create-container" class="flex flex-row">
    <FirstTimeDialog v-if="firsttime" @close="triggerReload" />
    <!-- Generation parameters -->
    <div id="create-params" class="dialog">
      <h1>{{ $t("create.params.title") }}</h1>
      <!-- File type -->
      <div>
        <h3>{{ $t("create.params.type.title") }}</h3>
        <md-chip-set>
          <md-filter-chip
            :selected="params.fileType === 'image'"
            :label="$t('create.params.type.image')"
            @click="toggleFileType('image')"
          >
            <md-icon slot="icon" class="icon-left">image</md-icon>
          </md-filter-chip>
          <md-filter-chip
            :selected="params.fileType === 'video'"
            :label="$t('create.params.type.video')"
            @click="toggleFileType('video')"
            disabled
          >
            <md-icon slot="icon" class="icon-left">movie</md-icon>
          </md-filter-chip>
        </md-chip-set>
      </div>
      <hr class="separator" />
      <!-- Number of images -->
      <div>
        <h3>{{ $t("create.params.number.title") }}</h3>
        <p class="text-secondary">{{ $t("create.params.number.subtitle") }}</p>
        <md-slider
          :disabled="params.fileType !== 'image'"
          v-model="params.imageNumber"
          min="1"
          max="9"
          step="1"
          ticks
          labeled
        />
      </div>
      <hr class="separator" />
      <!-- Image resolution -->
      <div>
        <h3>{{ $t("create.params.resolution.title") }}</h3>
        <p class="text-secondary">
          {{ $t("create.params.resolution.subtitle") }}
        </p>
        <md-chip-set>
          <md-filter-chip
            :selected="params.resolution.value === 'low'"
            :label="$t('create.params.resolution.chips.low')"
            @click="toggleResolution('low')"
            ref="chipLowRes"
          ></md-filter-chip>
          <md-filter-chip
            :selected="params.resolution.value === 'default'"
            :label="$t('create.params.resolution.chips.default')"
            @click="toggleResolution('default')"
            ref="chipDefaultRes"
          ></md-filter-chip>
          <md-filter-chip
            :selected="params.resolution.value === 'high'"
            :label="$t('create.params.resolution.chips.high')"
            @click="toggleResolution('high')"
            ref="chipHighRes"
          ></md-filter-chip>
          <md-filter-chip
            :selected="params.resolution.value === 'veryHigh'"
            :label="$t('create.params.resolution.chips.veryHigh')"
            @click="toggleResolution('veryHigh')"
            ref="chipVeryHighRes"
          ></md-filter-chip>
          <!-- Disabled due to problems with different aspect ratios -->
          <!-- <md-filter-chip
            :selected="params.resolution.value === 'custom'"
            :label="$t('create.params.resolution.chips.custom')"
            @click="toggleResolution('custom')"
          ></md-filter-chip> -->
        </md-chip-set>
        <div
          id="custom-resolution"
          class="flex flex-row"
          v-if="params.resolution.value === 'custom'"
        >
          <md-outlined-text-field
            v-model="params.resolution.customWidth"
            type="number"
            min="128"
            :max="params.resolution.maxValue"
            :label="$t('create.params.resolution.custom.width')"
          />
          <md-outlined-text-field
            v-model="params.resolution.customHeight"
            type="number"
            min="128"
            :max="params.resolution.maxValue"
            :label="$t('create.params.resolution.custom.height')"
          />
        </div>
      </div>
      <hr class="separator" />
      <!-- Image quality -->
      <!-- Removed until it is needed -->
      <!-- <div>
                <h3>{{ $t('create.params.quality.title') }}</h3>
                <p class="text-secondary">{{ $t('create.params.quality.subtitle') }}</p>
                <md-chip-set>
                    <md-filter-chip :selected="params.quality.value === 'low'" :label="$t('create.params.quality.chips.low')" @click="toggleQuality('low')"></md-filter-chip>
                    <md-filter-chip :selected="params.quality.value === 'default'" :label="$t('create.params.quality.chips.default')" @click="toggleQuality('default')"></md-filter-chip>
                    <md-filter-chip :selected="params.quality.value === 'high'" :label="$t('create.params.quality.chips.high')" @click="toggleQuality('high')"></md-filter-chip>
                    <md-filter-chip :selected="params.quality.value === 'veryHigh'" :label="$t('create.params.quality.chips.veryHigh')" @click="toggleQuality('veryHigh')"></md-filter-chip>
                    <md-filter-chip :selected="params.quality.value === 'custom'" :label="$t('create.params.quality.chips.custom')" @click="toggleQuality('custom')"></md-filter-chip>
                </md-chip-set>
                <div v-if="params.quality.value === 'custom'">
                    <md-slider v-model="params.quality.customValue" :min="params.quality.minValue" :max="params.quality.maxValue" step="1" labeled />
                </div>
            </div>
            <hr class="separator"> -->
      <!-- AI model -->
      <div>
        <h3>{{ $t("create.params.model.title") }}</h3>
        <md-chip-set>
          <div
            class="flex flex-row flex-wrap w-full items-center justify-between"
            @click="toggleModel($event, 'sd-turbo')"
          >
            <md-filter-chip
              :selected="params.model === 'sd-turbo'"
              label="Stable Diffusion Turbo"
            ></md-filter-chip>
            <md-text-button :disabled="state.loaded || state.loading"
              >{{ $t("create.params.model.preload") }}
              <md-icon slot="icon">download</md-icon>
            </md-text-button>
          </div>
        </md-chip-set>
      </div>
    </div>

    <!-- Prompt and generated images -->
    <div id="create-canvas" class="grow ml-8">
      <form
        id="create-prompt"
        class="flex flex-row items-center justify-between"
        @submit.prevent="loadAndGenerate(true)"
      >
        <textarea
          id="prompt"
          rows="1"
          autocomplete="off"
          v-model="prompt"
          type="text"
          :placeholder="$t('create.prompt')"
          @input="resizePrompt()"
        />
        <md-filled-button id="create-submit" type="submit" form="create-prompt"
          >{{ $t("create.submit") }}
          <md-icon slot="icon" class="material-icons">auto_awesome</md-icon>
        </md-filled-button>
      </form>
      <div id="create-generated" class="dialog">
        <div
          class="generation-container flex"
          v-show="state.generated"
          v-for="imageNumber in state.imageCount"
          :key="imageNumber"
        >
          <div :id="`img-div-${imageNumber - 1}`" class="generated-image">
            <canvas
              :id="`create-canvas-${imageNumber - 1}`"
              :alt="`Generated image ${imageNumber}`"
            />
          </div>
        </div>
        <!-- TODO Make carrousel of image-prompts -->
        <div
          class="generation-container flex"
          v-if="
            !state.generating &&
            !state.generated &&
            !state.loaded &&
            !state.loading
          "
        >
          <img src="@img/create/examples/example1.webp" alt="Example image" />
          <p class="text-lg font-normal mt-8">
            "{{ $t("create.examplePrompts.example1") }}"
          </p>
        </div>
        <!-- Progress indicator -->
        <div class="text-center mb-10" v-if="state.loading || state.generating">
          <h3 id="status">{{ $t("create.status.title") }}</h3>
          <p class="mb-4">{{ $t("create.status.subtitle") }}</p>
          <md-linear-progress indeterminate />
        </div>
        <!-- Models loaded -->
        <div
          class="generation-container flex"
          v-if="
            state.loaded &&
            !state.generated &&
            !state.loading &&
            !state.generating
          "
        >
          <h3>{{ $t("create.status.loaded.title") }}</h3>
          <p>{{ $t("create.status.loaded.subtitle") }}</p>
        </div>
      </div>
      <div
        v-if="generatedMedia && generatedMedia.length !== 0"
        class="mx-auto flex flex-col w-fit items-center justify-center"
      >
        <!-- Add to album option -->
        <AlbumSelector
          type="add"
          v-if="generatedMedia && generatedMedia.length > 0"
          :media="generatedMedia"
          :key="state.generated"
        />
        <md-text-button @click="addToAlbumFunc">
          <md-icon slot="icon">add</md-icon>
          {{ $t("photos.detail.addToAlbum") }}
        </md-text-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
  @import "@css/custom-media.css";

  @media (--header-break) {
    /* Gen params should be on the bottom */
    #create-container {
      flex-direction: column-reverse;
    }
  }

  @media (--mobile) {
    #create-canvas {
      margin: 0;
    }

    #create-prompt {
      flex-direction: column;
      justify-content: center;
    }

    #create-submit {
      margin: 1rem 0 0 0;
    }
  }

  @media (--mobile-m) {
    #prompt {
      height: 87px !important;
    }
  }

  #create-params {
    width: fit-content;
    height: fit-content;
    min-width: 20rem;
    max-width: 32rem;
    background: var(--fondo-oscuro);
    padding: 1rem 3rem;
    margin: 0.5rem 0 0 -3rem;
    border-radius: 0 30px 30px 0;
  }

  #prompt {
    width: 100%;
    min-width: 10rem;
    padding: 1rem;
    border: 2px solid var(--texto-gris);
    border-radius: 1rem;
    background: var(--fondo-oscuro);
    color: var(--texto-blanco);
    font-size: 1rem;
    margin: 0.25rem 0;
    height: auto;
    resize: none;
    overflow: auto;
  }

  #custom-resolution md-outlined-text-field {
    width: 40%;
    margin: 0 0.5rem;
  }

  #create-generated {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    margin: 1rem auto;
    background: var(--fondo-oscuro);
    align-items: center;
    padding: 1.5rem;
    min-height: 500px;
    /* Gradient border */
    background: linear-gradient(var(--fondo-oscuro), var(--fondo-oscuro))
        padding-box,
      var(--gradiente) border-box;
    border-radius: 30px;
    border: 4px solid transparent;
  }

  #create-generated img {
    max-width: 100%;
    max-height: 500px;
    margin: 0.5rem;
    border-radius: 1rem;
  }

  #create-generated canvas {
    max-width: 100%;
  }

  .generation-container {
    justify-content: center;
    flex-direction: column;
    align-items: center;
  }

  md-chip-set {
    margin: 1rem 0;
  }

  md-slider {
    margin: 0.5rem 0;
    width: 100%;
  }

  md-filled-button {
    margin-left: 15px;
  }

  h3 {
    margin: 1rem 0;
  }
</style>
