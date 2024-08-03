<script setup lang="ts">
  import { checkWebGPU, checkWebGPUShaderf16 } from "@ts/common";
  import { LOCALSTORAGE_DEVICE_INFO } from "@ts/constants";
  import { Ref, nextTick, onMounted, ref } from "vue";
  import { useI18n } from "vue-i18n";

  const emit = defineEmits(["close"]);

  const $t = useI18n().t;

  const isSupported = ref(false);
  const unsupportedReason = ref();
  const supportedRamSubtitle = ref();
  const ramAmounts = [4, 8, 12, 16];
  const vramAmounts = [2, 4, 6, 8, 12, 16, 24];
  const ramAmount = ref();
  const vramAmount = ref();

  const ramMenu: Ref<any> = ref(null);
  const vramMenu: Ref<any> = ref(null);

  const toggleMenu = (mdMenu: any) => {
    if (mdMenu) mdMenu.open = !mdMenu.open;
  };

  const saveConfiguration = () => {
    localStorage.setItem(
      LOCALSTORAGE_DEVICE_INFO,
      JSON.stringify({
        webgpu: true,
        shaderf16: true,
        ram: ramAmount.value,
        vram: vramAmount.value
      })
    );
    // Close dialog
    emit("close");
  };

  onMounted(async () => {
    // Check for WebGPU and shader-f16 support
    let supported = await checkWebGPU();
    if (!supported) {
      unsupportedReason.value.innerHTML =
        $t("details") +
        $t("create.firstTime.unsupported.details.browserPrerequisite") +
        "<b>WebGPU</b>";
      return;
    }
    supported = await checkWebGPUShaderf16();
    if (!supported) {
      unsupportedReason.value.innerHTML =
        $t("details") +
        $t("create.firstTime.unsupported.details.gpuPrerequisite") +
        "<b>'shader-f16'</b>";
    }
    isSupported.value = supported;

    nextTick(() => {
      if (isSupported.value && supportedRamSubtitle.value) {
        supportedRamSubtitle.value.innerHTML = $t(
          "create.firstTime.supported.ramRequisite.subtitle"
        );
      }
    });
  });
</script>

<template>
  <div
    id="first-time-dialog-container"
    class="fixed w-full h-full top-0 left-0"
  >
    <form v-if="isSupported" @submit.prevent="saveConfiguration">
      <div
        id="first-time-dialog"
        class="dialog fixed flex flex-col gap-4 items-center"
      >
        <div id="first-time-dialog-title" class="flex items-center gap-4">
          <md-icon class="material-symbols-outlined">info</md-icon>
          <h2>{{ $t("create.firstTime.supported.title") }}</h2>
        </div>
        <p>{{ $t("create.firstTime.supported.subtitle") }}</p>
        <div id="first-time-ram-requisites" class="flex flex-col gap-6">
          <h4>{{ $t("create.firstTime.supported.ramRequisite.title") }}</h4>
          <p ref="supportedRamSubtitle"></p>
          <!-- Amount dropdowns -->

          <!-- RAM Amount -->
          <div class="relative">
            <md-outlined-text-field
              id="ram-amount"
              required
              autocomplete="off"
              readonly
              suffixText="GiB"
              @click="toggleMenu(ramMenu)"
              :label="$t('create.firstTime.supported.ramRequisite.ramAmount')"
              v-model="ramAmount"
            >
            </md-outlined-text-field>
            <md-menu anchor="ram-amount" id="ram-menu" ref="ramMenu">
              <md-menu-item
                v-for="amount in ramAmounts"
                :key="amount"
                @click="ramAmount = amount"
              >
                {{ amount }} GiB
              </md-menu-item>
            </md-menu>
          </div>
          <!-- VRAM Amount -->
          <div class="relative">
            <md-outlined-text-field
              id="vram-amount"
              required
              autocomplete="off"
              readonly
              suffixText="GiB"
              @click="toggleMenu(vramMenu)"
              :label="$t('create.firstTime.supported.ramRequisite.vramAmount')"
              v-model="vramAmount"
            ></md-outlined-text-field>
            <md-menu anchor="vram-amount" id="vram-menu" ref="vramMenu">
              <md-menu-item
                v-for="amount in vramAmounts"
                :key="amount"
                @click="vramAmount = amount"
              >
                {{ amount }} GiB
              </md-menu-item>
            </md-menu>
          </div>
        </div>
        <!-- <p>{{ $t("create.firstTime.supported.change") }}</p> -->
        <md-filled-button
          :disabled="vramAmount === undefined || ramAmount === undefined"
        >
          <md-icon slot="icon">save</md-icon>
          {{ $t("saveContinue") }}
        </md-filled-button>
      </div>
    </form>
    <div
      v-else
      id="first-time-dialog"
      class="dialog fixed flex flex-col gap-4 items-center"
      style="border-color: var(--error); color: var(--error)"
    >
      <div class="flex items-center gap-4">
        <md-icon class="material-symbols-outlined">error</md-icon>
        <h2 class="error">
          {{ $t("create.firstTime.unsupported.title") }}
        </h2>
      </div>
      <p>{{ $t("create.firstTime.unsupported.subtitle") }}</p>
      <p ref="unsupportedReason"></p>
    </div>
  </div>
</template>

<style scoped lang="scss">
  @import "@css/custom-media.css";

  @media (--header-break) {
    #first-time-dialog {
      #ram-amount,
      #vram-amount {
        width: 100% !important;
      }
    }
  }

  @media (--mobile) {
    #first-time-dialog-container {
      overflow: hidden;
      // height: 150%;
      #first-time-dialog {
        bottom: 20px !important;
        top: unset !important;
        left: 0 !important;
        right: 0 !important;
        margin: 0 auto;
        transform: unset !important;
      }
    }
  }

  #first-time-dialog-container {
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(3px);
    z-index: 10;

    #first-time-dialog {
      padding: 2rem;
      height: fit-content;
      width: 90vw;
      max-width: 1100px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      border: 5px solid;
      #first-time-dialog-title md-icon {
        font-size: 32px;
        --md-icon-size: 32px;
      }

      #ram-amount,
      #vram-amount {
        width: 100%;
      }
    }
  }
</style>
