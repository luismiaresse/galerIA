<script setup lang="ts">
  import { RouterLink } from "vue-router";
  import { getAuth, resetAuth } from "@ts/auth";
  import { logout } from "@ts/requests/auth";
  import { ref } from "vue";
  import { getURLFromBlob } from "@ts/common";
  import { USER_PROFILE_ANONYMOUS } from "@ts/constants";
  import { IUserData } from "@ts/definitions";

  const auth = getAuth();
  const emit = defineEmits(["logout"]);
  const props = defineProps({
    user: Object as () => IUserData
  });

  const userData = ref(props.user);
  const userPhoto = ref(
    userData.value?.photo
      ? getURLFromBlob(userData.value?.photo)
      : USER_PROFILE_ANONYMOUS
  );

  const logoutFunc = async () => {
    if (await logout(auth!)) {
      resetAuth();
    }
    emit("logout");
  };
</script>

<template>
  <div
    v-if="userData"
    id="account-popover"
    class="dialog p-0 absolute font-bold overflow-hidden"
    popover
  >
    <div id="account-info">
      <img :src="userPhoto" alt="photo" />
      <div id="account-info-text">
        <p class="text-primary">{{ userData.username }}</p>
        <p class="text-secondary">{{ userData.email }}</p>
      </div>
    </div>
    <div id="account-options" class="mb-4">
      <ul>
        <li>
          <RouterLink class="button button-orange" :to="{ name: 'Settings' }">
            <md-icon class="material-symbols-rounded">settings</md-icon>
            <p>{{ $t("header.account.settings") }}</p>
          </RouterLink>
        </li>
        <li>
          <RouterLink
            class="button button-red"
            @click="logoutFunc"
            :to="{ name: 'Auth' }"
          >
            <md-icon class="material-symbols-rounded">logout</md-icon>
            <p>{{ $t("header.account.logout") }}</p>
          </RouterLink>
        </li>
      </ul>
    </div>
    <!-- TODO Multiple account support -->
    <!-- <div id="other-accounts" v-for="acc in accounts" :key="acc.id"> -->
    <!-- <div id="other-accounts-container">
      <hr class="separator" />
      <ul>
        <li class="other-account">
          <div class="other-account-info">
            <img src="@img/other-account.jpg" alt="account" />
            <div class="other-account-info-text">
              <p class="text-primary">Juan Madrid</p>
              <p class="text-secondary">juan.madrid@hotmail.es</p>
            </div>
          </div>
          <RouterLink class="button button-gradient" :to="{ name: 'Auth' }">{{
            $t("change")
          }}</RouterLink>
        </li>
      </ul>
      <hr class="separator" />
    </div>
    <RouterLink id="add-account" class="button" :to="{ name: 'Auth' }">
      <md-icon class="material-symbols-rounded">add</md-icon>
      <p>{{ $t("header.account.add") }}</p>
    </RouterLink>
    <hr class="separator" style="margin: 0" />
    <div id="signout-all">
      <RouterLink class="button" @click="logoutFunc" :to="{ name: 'Auth' }">
        <md-icon class="material-symbols-rounded">logout</md-icon>
        <p>{{ $t("header.account.logoutAll") }}</p>
      </RouterLink>
    </div> -->
  </div>
</template>

<style scoped lang="scss">
  @import "@css/custom-media.css";

  @media (--mobile) {
    #account-popover {
      position: fixed;
      margin: 0 auto;
      top: auto;
      bottom: 1rem;
      width: 90vw;

      &::backdrop {
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(3px);
      }

      .other-account a {
        margin: 10px 0 3px 10px;
      }
    }
  }

  #account-popover {
    font-size: 16px;
    top: 6rem;
    width: 25rem;
    margin-left: auto;
    margin-right: 1rem;
    z-index: 6;
    max-width: 500px;
    max-height: 500px;

    #account-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 0.75rem;

      & img {
        width: 100px;
        height: 100px;
        aspect-ratio: 1/1;
        border-radius: 100%;
        margin-bottom: 0.5rem;
        /* Gradient circle */
        background: var(--gradiente);
        padding: 0.2em;
      }
    }

    #account-options {
      display: flex;
      flex-direction: column;
      align-items: center;

      & ul {
        display: flex;
        flex-direction: row;
        list-style: none;
        padding: 0 1rem;
      }
    }

    .button {
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 15px;
      padding: 3px 10px;
      margin: 0 0.5rem;
      text-decoration: none;
      color: var(--texto-blanco);
    }

    .button-orange {
      border: 2px solid var(--naranja);
    }

    .button-red {
      border: 2px solid var(--rojo);
    }

    .button-gradient {
      border: none;
      position: relative;
      margin-left: 20px;
      background: var(--fondo-oscuro);
    }

    /* Necesario para gradiente */
    .button-gradient::before {
      position: absolute;
      border-radius: 100px;
      content: "";
      top: -0.2em;
      bottom: -0.2em;
      right: -0.2em;
      left: -0.2em;
      z-index: -1;
      background: var(--gradiente);
    }

    #other-accounts-container {
      display: flex;
      flex-direction: column;
      align-items: stretch;
      padding: 0.6rem;
    }

    .other-account {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-around;
      border-radius: 15px;
      background: var(--fondo-claro);

      & img {
        width: 48px;
        height: 48px;
        border-radius: 100%;
        margin-right: 1rem;
      }

      .other-account-info {
        display: flex;
        flex-direction: row;
      }

      .other-account-info-text {
        display: flex;
        flex-direction: column;
      }
    }

    #add-account {
      color: var(--naranja);
      margin-bottom: 1rem;
    }

    #signout-all {
      background: rgba(255, 0, 0, 0.1);
      margin-left: auto;
      margin-right: auto;
      border-radius: 0 0 30px 30px;
      padding: 1rem;

      & > * {
        color: var(--rojo);
      }
    }
  }
</style>
