<script setup lang="ts">
  import {
    checkEmailUser,
    checkPasswordUser,
    checkUsernameUser
  } from "@ts/common";
  import { register } from "@ts/requests/auth";
  import { IUser } from "@ts/definitions";
  import { Ref, ref } from "vue";
  import { useI18n } from "vue-i18n";

  const $t = useI18n().t;

  const usernameField = ref();
  const emailField = ref();
  const passwordField = ref();
  const passwordRepeatField = ref();
  const passwordRepeat = ref();
  const errorText = ref();
  const successText = ref();

  // Enter to register

  const user: Ref<IUser> = ref({
    id: undefined,
    username: "",
    email: "",
    password: ""
  });
  const registerFunc = async () => {
    const checkPasswordsMatch = () => {
      // Check if passwords match
      return user.value.password == passwordRepeat.value;
    };

    // Check if username, email and password are valid and passwords match
    if (!checkUsernameUser(user.value)) {
      usernameField.value.error = true;
      return;
    }
    usernameField.value.error = false;

    if (!checkEmailUser(user.value)) {
      emailField.value.error = true;
      return;
    }
    emailField.value.error = false;

    if (!checkPasswordUser(user.value)) {
      passwordField.value.error = true;
      passwordField.value.errorText = $t("auth.error.passwordInvalid");
      return;
    }
    passwordField.value.error = false;

    if (!checkPasswordsMatch()) {
      passwordRepeatField.value.error = true;
      return;
    }
    passwordRepeatField.value.error = false;

    // Send request to server
    const { data, status } = await register(user.value);

    if (status !== 201 || !data) {
      $("#register-error").removeClass("hidden");
      switch (status) {
        case 400:
          errorText.value.innerHTML = $t("auth.error.registerUsername");
          break;
        case 409:
          errorText.value.innerHTML = $t("auth.error.registerEmail");
          break;
        default:
          errorText.value.innerHTML = $t("auth.error.unknown");
          break;
      }
      return;
    }
    $("#register-error").addClass("hidden");
    // Show success message
    $("#register-success").removeClass("hidden");
    successText.value.innerHTML = $t("auth.success.register");

    // 4. Login and redirect to home
    // TODO: Auto login or keep in page?
    // this.$router.push("/");
  };
</script>

<template>
  <div id="register" class="dialog flex flex-col justify-evenly p-5 w-full">
    <h1>{{ $t("auth.registerTitle") }}</h1>
    <hr class="separator" />
    <form
      @keydown.enter="registerFunc"
      @submit.prevent="registerFunc"
      class="flex flex-col justify-evenly items-center h-full gap-5 mt-2"
    >
      <md-outlined-text-field
        required
        name="username"
        type="username"
        :label="$t('auth.username')"
        v-model="user.username"
        :error-text="$t('auth.error.usernameInvalid')"
        ref="usernameField"
      >
      </md-outlined-text-field>
      <md-outlined-text-field
        required
        name="email"
        type="email"
        :label="$t('auth.email')"
        v-model="user.email"
        :error-text="$t('auth.error.emailInvalid')"
        ref="emailField"
      >
      </md-outlined-text-field>
      <md-outlined-text-field
        required
        name="password"
        type="password"
        :label="$t('auth.password')"
        v-model="user.password"
        ref="passwordField"
      >
      </md-outlined-text-field>
      <md-outlined-text-field
        required
        name="passwordRepeat"
        type="password"
        :label="$t('auth.passwordRepeat')"
        :error-text="$t('auth.error.passwordRepeat')"
        v-model="passwordRepeat"
        ref="passwordRepeatField"
      >
      </md-outlined-text-field>
      <div
        id="register-error"
        class="error flex hidden font-secondary items-center"
      >
        <md-icon class="mr-1 my-2">error</md-icon>
        <p ref="errorText"></p>
      </div>
      <div
        id="register-success"
        class="success flex hidden font-secondary items-center"
      >
        <md-icon class="mr-1 my-2">check</md-icon>
        <p ref="successText"></p>
      </div>
      <md-filled-button type="submit">{{
        $t("auth.register")
      }}</md-filled-button>
      <!-- <p>{{ $t("auth.emailConfirmation") }}</p> -->
    </form>
  </div>
</template>

<style scoped lang="scss">
  #register {
    min-width: 250px;
    max-width: 500px;

    h1,
    p {
      text-align: center;
    }

    md-outlined-text-field {
      width: 75%;
    }
  }
</style>
