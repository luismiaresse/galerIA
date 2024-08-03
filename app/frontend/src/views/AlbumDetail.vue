<script setup>
  import UploadMedia from "@/components/common/UploadMedia.vue";
  import Timeline from "@/components/common/Timeline.vue";
  import { ref } from "vue";

  const refresh = ref(false);

  const refreshMedia = () => {
    refresh.value = !refresh.value;
  };
</script>

<template>
  <div id="album-detail">
    <Timeline :key="refresh" type="album" />
    <UploadMedia @refresh-media="refreshMedia" />
  </div>
</template>

<style></style>
