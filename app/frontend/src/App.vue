<script setup lang="ts">
  import { provide, ref, Suspense } from "vue";
  import Header from "@/components/header/Header.vue";
  import { getAuth, resetAuth } from "@ts/auth";
  import { checkAuthTokenHealth } from "@ts/requests/auth";
  import { RouterView } from "vue-router";
  import { useI18n } from "vue-i18n";
  import { getUserData } from "@ts/requests/user";
  import { waitForIndexedDB } from "@ts/indexeddb";

  // Set theme (default: dark)
  const theme = ref("dark");
  $("#app").addClass(theme.value);

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

  const userData = ref();

  waitForIndexedDB(db).then(() => {
    const auth = getAuth();
    checkAuthTokenHealth(auth).then((check) => {
      if (!check) {
        resetAuth();
      } else {
        getUserData(auth, db.value).then((user) => {
          userData.value = user;
        });
      }
    });
  });
  provide("db", db);
  provide("userData", userData);
</script>

<template>
  <div id="app-container" class="h-full">
    <!-- Suspense needed for async components -->
    <Suspense>
      <div>
        <Header />
        <RouterView v-slot="{ Component, route }">
          <Transition name="page-opacity" mode="out-in">
            <div id="content" :key="String(route.name)">
              <component :is="Component"></component>
            </div>
          </Transition>
        </RouterView>
      </div>
    </Suspense>
  </div>
</template>

<style lang="scss">
  #app {
    overflow-x: hidden;
    overflow-y: auto;
    height: 100%;
    overflow-x: hidden;
    overflow-y: auto;
    scrollbar-color: var(--fondo) var(--fondo-oscuro);
    scrollbar-width: thin;

    #content {
      padding: 0 2rem 0 2rem;
      height: 84dvh;
    }

    /* Transitions */
    .page-opacity-enter-active,
    .page-opacity-leave-active {
      transition: 200ms ease all;
    }

    .page-opacity-enter,
    .page-opacity-leave-to {
      opacity: 0;
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
  }
</style>
