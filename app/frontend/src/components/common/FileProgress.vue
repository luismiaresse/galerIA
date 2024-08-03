<script setup lang="ts">
  const props = defineProps<{
    total: number;
    completed: number;
  }>();

  // Show warning if the user tries to navigate away from the page
  window.onbeforeunload = (e) => {
    if (props.total > props.completed) {
      e.preventDefault();
    }
  };

  const emit = defineEmits(["cancelUpload"]);

  const cancelUploadFunc = () => {
    window.onbeforeunload = null;
    emit("cancelUpload");
  };
</script>

<template>
  <div
    id="file-progress"
    class="dialog h-[100px] min-w-[320px] max-w-[500px] w-full fixed bottom-28 p-4 left-0 right-0 mx-auto"
  >
    <div class="flex flex-row items-center gap-6 justify-evenly">
      <p class="text-center">
        {{ $t("uploading") + " " }} {{ props.total }}
        {{ " " + $t("files") + "..." }}
      </p>
      <md-text-button @click="cancelUploadFunc">
        <md-icon slot="icon">close</md-icon>
        {{ $t("cancel") }}
      </md-text-button>
    </div>
    <div class="flex flex-row items-center gap-6 justify-evenly">
      <p class="text-center">
        {{ completed }}/{{ props.total }} {{ $t("completed") }}
      </p>
      <md-linear-progress
        class="w-1/2"
        :value="completed"
        :max="props.total"
      ></md-linear-progress>
    </div>
  </div>
</template>

<style scoped lang="scss">
  @import "@css/custom-media.css";

  @media (--mobile-m) {
    #file-progress {
      bottom: 160px;
    }
  }
</style>
