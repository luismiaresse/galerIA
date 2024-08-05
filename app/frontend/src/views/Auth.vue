<script setup lang="ts">
  import Register from "@/components/auth/Register.vue";
  import Login from "@/components/auth/Login.vue";
  import { useI18n } from "vue-i18n";
  import About from "./About.vue";

  // Change title
  const $t = useI18n().t;
  document.title = $t("header.account.loginOrRegister") + " - galerIA";
</script>

<template>
  <h1 class="text-primary text-center">
    {{ $t("auth.title") }}<span>{{ $t("auth.titleColored") }}</span>
  </h1>
  <div
    class="mt-10 flex flex-col justify-between items-center gap-12 w-full h-[90%]"
  >
    <div
      class="flex flex-row flex-wrap justify-center items-center gap-4 w-full"
    >
      <Register />
      <Login />
    </div>
    <About />
  </div>
</template>

<style scoped>
  span {
    /* Gradiente */
    background: var(--gradiente);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
</style>
