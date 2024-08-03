<script setup lang="ts">
  import { provide, ref, Suspense } from "vue";
  import AccountPopover from "@/components/header/AccountPopover.vue";
  import Header from "@/components/header/Header.vue";
  import { useUserStore } from "@js/stores/user";
  import { getAccountData } from "@ts/requests/user";
  import { getAuth, resetAuth } from "@ts/auth";
  import { checkAuthTokenHealth } from "@ts/requests/auth";
  import { RouterView } from "vue-router";
  import { useI18n } from "vue-i18n";

  // Set theme (default: dark)
  const theme = ref("dark");
  $("#app").addClass(theme.value);

  const userSt = useUserStore();

  // Get user data and store it
  const auth = getAuth();
  checkAuthTokenHealth(auth).then((check) => {
    if (!check) {
      console.error("Auth is invalid");
      resetAuth();
    }
  });

  getAccountData(auth!).then((data) => {
    if (data) {
      userSt.setUser(data);
    }
  });

  // Set language
  const userLang = window.navigator.language;
  const i18n = useI18n();
  if (userLang.includes("es") || userLang.includes("gl")) {
    i18n.locale.value = "es";
    document.documentElement.lang = "es";
  } else {
    i18n.locale.value = "en";
    document.documentElement.lang = "en";
  }

  // Create IndexedDB database if not exists
  let db = ref();
  const request = indexedDB.open("galeria", 1);
  request.onerror = () => {
    console.error("Error opening database");
  };
  request.onsuccess = (event: any) => {
    db.value = event.target.result;
  };
  request.onupgradeneeded = (event: any) => {
    db.value = event.target.result;
    const objectStore = db.value.createObjectStore("media", { keyPath: "id" });
    objectStore.createIndex("albumid", "albumid", { unique: false });
  };

  provide("db", db);
</script>

<template>
  <div id="app-container" class="h-full">
    <Header />
    <AccountPopover id="account-popover" />
    <!-- Suspense needed for async components -->
    <Suspense>
      <RouterView v-slot="{ Component, route }">
        <Transition name="page-opacity" mode="out-in">
          <div id="content" :key="String(route.name)">
            <component :is="Component"></component>
          </div>
        </Transition>
      </RouterView>
    </Suspense>
  </div>
</template>

<style>
  #app {
    overflow-x: hidden;
    overflow-y: auto;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-color: var(--fondo) var(--fondo-oscuro);
    scrollbar-width: thin;
  }

  #content {
    padding: 0 2.5% 3% 2.5%;
    height: 88dvh;
  }

  footer {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2rem;
    background: var(--fondo-oscuro);
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--texto-gris);
  }

  /* Transitions */
  .page-opacity-enter-active,
  .page-opacity-leave-active {
    transition: 300ms ease all;
  }

  .page-opacity-enter,
  .page-opacity-leave-to {
    opacity: 0;
  }
</style>
