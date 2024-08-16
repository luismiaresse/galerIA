<script setup lang="ts">
  import { RouterLink, useRouter } from "vue-router";
  import HeaderElement from "./HeaderElement.vue";
  import { inject, ref, Ref, watchEffect } from "vue";
  import { getURLFromBlob } from "@ts/common";
  import AccountPopover from "./AccountPopover.vue";
  import { IUserData } from "@ts/definitions";
  import { USER_PROFILE_ANONYMOUS } from "@ts/constants";

  const router = useRouter();
  const userData: Ref<IUserData | null> | undefined = inject("userData");
  const userPhoto = ref(USER_PROFILE_ANONYMOUS);

  // Looks for changes in userData and updates userPhoto
  watchEffect(() => {
    if (userData && userData.value && userData.value.photo) {
      userPhoto.value = getURLFromBlob(userData.value.photo);
    }
  });

  const showPopover = () => {
    $("#account-popover")[0].showPopover();
  };

  const setAnonymousUser = () => {
    userPhoto.value = USER_PROFILE_ANONYMOUS;
    if (userData) {
      userData.value = null;
    }
    router.push({ name: "Auth" });
  };
</script>

<template>
  <header>
    <RouterLink id="logo" to="/">
      <img src="@img/logo.webp" alt="logo" />
    </RouterLink>
    <ul id="nav-items">
      <li>
        <HeaderElement
          icon="photo_library"
          routerName="Photos"
          :displayName="$t('header.pages.photos')"
        />
      </li>
      <li>
        <HeaderElement
          icon="collections_bookmark"
          routerName="Albums"
          :displayName="$t('header.pages.albums')"
        />
      </li>
      <li>
        <HeaderElement
          icon="supervised_user_circle"
          routerName="Shared"
          :displayName="$t('header.pages.shared')"
        />
      </li>
      <li>
        <HeaderElement
          icon="add_circle"
          routerName="Create"
          :displayName="$t('header.pages.create')"
        />
      </li>
    </ul>
    <div v-if="userData" id="account" @click="showPopover">
      <p>{{ userData.username }}</p>
      <img id="profile-photo" :src="userPhoto" alt="photo" />
      <AccountPopover :user="userData" @logout="setAnonymousUser" />
    </div>
    <RouterLink v-else id="account" :to="{ name: 'Auth' }">
      <p>{{ $t("header.account.login") }}</p>
      <img
        id="profile-photo"
        :src="USER_PROFILE_ANONYMOUS"
        alt="photo"
        class="rounded-none"
      />
    </RouterLink>
  </header>
</template>

<style scoped lang="scss">
  @import "@css/custom-media.css";

  header {
    position: sticky;
    top: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(
      180deg,
      rgba(53, 33, 33, 1) 0%,
      rgba(26, 26, 26, 1) 100%
    );
    font-weight: bold;
    font-size: 20px;
    padding: 1rem 1rem;
    height: var(--header-height);
    z-index: 100; /* Avoid most elements to be on top */
  }

  #nav-items {
    display: flex;
    flex-direction: row;
    margin: 0 auto;
    position: relative;
    list-style: none;
    justify-content: space-around;
    width: 60%;
    top: 10px;
  }

  @media (--header-break) {
    header {
      align-items: flex-start;
      height: auto;
      position: relative;
    }
    #nav-items {
      margin-top: 50px;
      width: auto;
    }
    #nav-items li {
      margin: 1rem 0;
    }
  }

  @media (--mobile) {
    header {
      flex-direction: column;
      align-items: center;
      height: auto;
    }
    #logo {
      position: inherit !important;
      left: auto !important;
    }
    #nav-items {
      margin-top: 0;
      display: flex;
      flex-direction: column;
      align-items: center;

      & li {
        margin: 1rem 0;
      }
    }

    #account {
      position: inherit !important;
      right: auto !important;
    }
  }

  /* Logo elements */
  #logo {
    position: absolute;
    display: flex;
    align-items: center;
    text-decoration: none;
    color: white;
    font-size: 25px;
    margin-right: 3%;
    left: 2%;

    & span {
      background: var(--gradiente);
      background-clip: text;
      -webkit-text-fill-color: transparent;
      padding: 0;
    }

    & img {
      height: 45px;
      max-width: fit-content;
    }
  }

  /* Account elements */
  #account {
    display: flex;
    position: absolute;
    align-items: center;
    font-weight: normal;
    cursor: pointer;
    margin-left: 3%;
    right: 2%;

    & img {
      min-width: 50px;
      width: 50px;
      min-height: 50px;
      height: 50px;
      aspect-ratio: 1/1;
      border-radius: 100%;
      margin-left: 1rem;
    }

    & p {
      text-wrap: nowrap;
      &:hover {
        background: var(--gradiente);
        background-clip: text;
        -webkit-text-fill-color: transparent;
      }
    }
  }
</style>
