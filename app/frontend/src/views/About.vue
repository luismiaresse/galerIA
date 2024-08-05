<script setup lang="ts"></script>

<template>
  <div class="text-center flex flex-col pb-6 relative bottom-0">
    <h3>
      {{ $t("about.title")
      }}<a
        href="https://github.com/luismiaresse"
        target="_blank"
        class="color-primary"
      >
        Luismi</a
      >
    </h3>
    <p class="text-secondary font-bold">{{ $t("about.subtitle") }}</p>
    <!-- GitHub icon -->
    <a
      class="flex flex-row gap-2 items-center justify-center"
      href="https://github.com/luismiaresse/galerIA"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img class="w-6" src="@img/github.webp" />
      {{ $t("about.github") }}
    </a>
  </div>
</template>

<style></style>
