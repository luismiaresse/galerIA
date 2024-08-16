<script setup lang="ts">
  import { login } from "@ts/requests/auth";
  import { inject, Ref, ref } from "vue";
  import { IUser, IUserData } from "@ts/definitions";
  import { useRouter } from "vue-router";
  import { AUTH_TOKEN_PREFIX } from "@ts/constants";
  import { getUserData } from "@ts/requests/user";
  const nameOrEmail = ref("");
  const password = ref("");
  const db: Ref<IDBDatabase> | undefined = inject("db");
  const userData: Ref<IUserData | null> | undefined = inject("userData");

  const router = useRouter();

  const loginFunc = async () => {
    let user: IUser = {
      username: undefined,
      email: undefined,
      password: password.value
    };

    // Check if first field is user or email
    if (nameOrEmail.value.includes("@")) {
      user.email = nameOrEmail.value;
      delete user.username;
    } else {
      user.username = nameOrEmail.value;
      delete user.email;
    }

    const auth = await login(user);
    const error = $("#login-error");

    if (!auth) {
      error.removeClass("hidden");
      return;
    }
    error.addClass("hidden");

    // Set token prefix
    if (userData) userData.value = await getUserData(auth.token, db!.value);

    auth.token = AUTH_TOKEN_PREFIX + auth.token;

    // Push to home
    router.push({ name: "Photos" });
  };
</script>

<template>
  <div
    id="login"
    class="dialog flex flex-col justify-evenly w-full mt-5 p-5 rounded-3xl"
  >
    <h1 class="text-center">{{ $t("auth.loginTitle") }}</h1>
    <hr class="separator" />
    <form
      @keydown.enter="loginFunc"
      @submit.prevent="loginFunc"
      class="flex flex-col justify-evenly items-center h-full gap-5 mt-2"
    >
      <md-outlined-text-field
        required
        name="username"
        :label="$t('auth.username') + '/' + $t('auth.email')"
        v-model="nameOrEmail"
      >
      </md-outlined-text-field>
      <md-outlined-text-field
        required
        name="password"
        :label="$t('auth.password')"
        type="password"
        v-model="password"
      >
      </md-outlined-text-field>
      <p
        id="login-error"
        class="error font-secondary hidden flex flex-row items-center text-center"
      >
        <md-icon class="mr-1 my-2">error</md-icon>
        {{ $t("auth.error.login") }}
      </p>
      <md-filled-button
        >{{ $t("auth.login") }}
        <md-icon slot="icon">login</md-icon>
      </md-filled-button>
      <!-- <md-text-button>{{ $t("auth.forgot") }}</md-text-button> -->
    </form>
  </div>
</template>

<style scoped lang="scss">
  #login {
    min-width: 250px;
    max-width: 500px;

    md-outlined-text-field {
      width: 75%;
    }
  }
</style>
