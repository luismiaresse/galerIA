<script setup lang="ts">
  import { ref } from "vue";
  import UploadMedia from "@/components/common/UploadMedia.vue";
  import Timeline from "@/components/common/Timeline.vue";
  import { useI18n } from "vue-i18n";

  // Change title
  const $t = useI18n().t;
  document.title = $t("header.pages.photos") + " - galerIA";

  const refresh = ref(false);

  const refreshMedia = () => {
    refresh.value = !refresh.value;
  };
</script>

<template>
  <Timeline :key="Number(refresh)" type="default" />
  <!-- TODO Disabled until implemented -->
  <!-- <div id="timescroll" class="absolute bottom-20 right-4 top-24">
    <div
      class="absolute right-1 w-1 -z-10 h-full rounded"
      style="background-color: #2f2f2f"
    />
    <div class="flex flex-col justify-between h-full">
      <div v-for="year in this.years" :key="year" class="timescroll-year">
        <div
          class="font-secondary flex flex-row items-center justify-between w-14 text-right font-bold"
        >
          <p>{{ year }}</p>
          <hr class="ml-1 w-3" />
        </div>
      </div>
    </div>
  </div> -->
  <UploadMedia @refresh-media="refreshMedia" />
</template>

<style scoped>
  @import "@css/custom-media.css";

  @media (--mobile) {
    #timescroll {
      display: none;
    }
  }

  @media (--header-break) {
    #timescroll {
      top: 11.5rem !important;
    }
  }
</style>
