<script setup lang="ts">
  import { getAuth } from "@ts/auth";
  import { LOCALSTORAGE_USERDATA } from "@ts/constants";
  import { deleteAccount } from "@ts/requests/user";
  import router from "@ts/router";

  const deleteAccountFunc = async () => {
    const auth = getAuth();
    if (!auth) {
      console.error("No login token");
      return;
    }

    // Delete the account
    const isDeleted = await deleteAccount(auth);
    if (isDeleted) {
      // Remove user data
      localStorage.removeItem(LOCALSTORAGE_USERDATA);
      // Redirect to login
      router.push({ name: "Auth" });
    }
  };

  const closePopover = () => {
    $("#account-delete-confirm-container")[0].hidePopover();
  };
</script>

<template>
  <div id="account-delete-confirm-container" popover>
    <div
      id="account-delete-confirm"
      class="dialog p-4 fixed flex flex-col justify-center gap-8"
    >
      <h3 class="font-bold text-center">
        {{ $t("settings.security.deleteAccount.confirmation") }}
      </h3>
      <div class="flex flex-row justify-evenly gap-4">
        <md-text-button @click="closePopover">
          <md-icon slot="icon">close</md-icon>
          {{ $t("cancel") }}</md-text-button
        >
        <md-filled-button @click="deleteAccountFunc">
          <md-icon slot="icon">delete</md-icon>
          {{ $t("delete") }}</md-filled-button
        >
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  #account-delete-confirm-container {
    background: var(--fondo-oscuro);
    z-index: 300;

    #account-delete-confirm {
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      width: 80%;
      max-width: 500px;
    }

    &::backdrop {
      background-color: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(3px);
    }
  }
</style>
