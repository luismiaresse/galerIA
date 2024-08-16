<script setup lang="ts">
  import AccountDeleteConfirm from "@/components/settings/AccountDeleteConfirm.vue";
  import { getAuth } from "@ts/auth";
  import {
    checkPassword,
    createThumbnail,
    getURLFromBlob,
    triggerInput
  } from "@ts/common";
  import {
    LOCALSTORAGE_USERDATA,
    MediaKinds,
    USER_PROFILE_ANONYMOUS
  } from "@ts/constants";
  import { IMedia, IUserData } from "@ts/definitions";
  import { putMedia } from "@ts/requests/media";
  import { changePassword } from "@ts/requests/user";
  import { inject, Ref, ref, watchEffect } from "vue";
  import { useI18n } from "vue-i18n";

  // Change title
  const $t = useI18n().t;
  document.title = $t("settings.title") + " - galerIA";

  const passwordOldField = ref(),
    passwordNew = ref(""),
    passwordNewField = ref(),
    passwordNewRepeat = ref(""),
    passwordNewRepeatField = ref(),
    passwordChanged = ref(false);

  const user: Ref<IUserData> = ref({
    username: "",
    email: "",
    password: ""
  });

  const userPhoto = ref(USER_PROFILE_ANONYMOUS);
  const userData: Ref<IUserData | null> | undefined = inject("userData");
  // Looks for changes in userData and updates userPhoto
  watchEffect(() => {
    if (userData && userData.value) {
      if (userData.value.photo)
        userPhoto.value = getURLFromBlob(userData.value.photo);

      user.value = userData.value;
    }
  });

  const newProfilePhotoFunc = async () => {
    // Upload new profile photo
    const file = await $("#new-photo-input").prop("files")[0];

    const auth = getAuth();
    if (!auth) {
      console.error("No login token");
      return;
    }

    // Upload the new photo
    const media: IMedia = {
      kind: MediaKinds.PROFILE,
      file: file
    };

    // Make thumbnail
    await createThumbnail(media);

    // Upload the new profile photo
    await putMedia(auth, media);

    // Remove old user data and replace it with the new one
    localStorage.removeItem(LOCALSTORAGE_USERDATA);
    $("#settings-profile-photo").attr("src", URL.createObjectURL(media.file!));
    $("#profile-photo").attr("src", URL.createObjectURL(media.file!));
  };

  const showDeletePopover = () => {
    $("#account-delete-confirm-container")[0].showPopover();
  };

  const cancelFunc = () => {
    user.value.password = "";
    passwordNew.value = "";
    passwordNewRepeat.value = "";
    passwordChanged.value = false;
  };

  const changePasswordFunc = async () => {
    const checkPasswordsMatch = () => {
      // Check if passwords match
      return passwordNew.value == passwordNewRepeat.value;
    };

    if (!checkPassword(passwordNew.value)) {
      passwordNewField.value.error = true;
      return;
    }
    passwordNewField.value.error = false;

    if (!checkPasswordsMatch()) {
      passwordNewRepeatField.value.error = true;
      return;
    }
    passwordNewRepeatField.value.error = false;

    // Change the user password
    const auth = getAuth();
    if (!auth) {
      console.error("No login token");
      return;
    }

    // Change the password
    const status = await changePassword(
      auth,
      user.value.password as string,
      passwordNew.value
    );

    switch (status) {
      case 200:
        $("#password-success").removeClass("hidden");
        $("#password-error").addClass("hidden");
        break;
      case 400:
        $("#password-error").removeClass("hidden");
        $("#password-success").addClass("hidden");
        break;
      // Current password is incorrect or new password is the same
      case 406:
        $("#password-error").removeClass("hidden");
        break;
      default:
        // Show unknown error message
        $("#password-error").removeClass("hidden");
        $("#password-success").addClass("hidden");
        break;
    }
  };
</script>

<template>
  <h1 class="mb-4">{{ $t("settings.title") }}</h1>
  <div class="flex flex-col gap-8">
    <div id="settings" class="flex flex-row gap-8">
      <!-- Profile settings -->
      <div
        id="settings-profile"
        class="dialog p-6 flex flex-col justify-between"
      >
        <div class="flex flex-row gap-3 items-center mb-4">
          <md-icon>account_circle</md-icon>
          <h2>{{ $t("settings.profile.title") }}</h2>
        </div>
        <div id="settings-profile-content" class="flex flex-row gap-4 h-full">
          <div class="flex flex-col justify-center items-center gap-4">
            <img
              id="settings-profile-photo"
              :src="userPhoto"
              alt="profile"
              class="rounded-full min-w-32 max-w-44 aspect-square"
            />
            <md-text-button @click="triggerInput('#new-photo-input')">
              <p>{{ $t("change") }}</p>
              <md-icon slot="icon">add_a_photo</md-icon>
              <input
                id="new-photo-input"
                type="file"
                accept="image/*"
                hidden
                @change="newProfilePhotoFunc"
              />
            </md-text-button>
          </div>
          <div
            id="settings-profile-info"
            class="flex flex-col gap-4 ml-8 w-1/2"
          >
            <div class="flex flex-col gap-4">
              <md-outlined-text-field
                v-model="user.username"
                readonly
                :label="$t('settings.profile.username')"
              />
              <md-outlined-text-field
                v-model="user.email"
                readonly
                :label="$t('settings.profile.email')"
              />
            </div>
            <!-- TODO Email verification -->
            <!-- <div class="flex flex-col justify-end">
                <md-text-button>{{
                  $t("settings.profile.emailVerificationSend")
                }}</md-text-button>
              </div>
              <md-outlined-text-field
                :disabled="emailVerification"
                v-model="emailVerification"
                :label="$t('settings.profile.emailVerification')"
              /> -->
          </div>
        </div>
      </div>
      <!-- Security settings -->
      <div id="settings-security" class="dialog p-6">
        <div class="flex flex-row gap-3 items-center mb-4">
          <md-icon>encrypted</md-icon>
          <h2>{{ $t("settings.security.title") }}</h2>
        </div>
        <div id="settings-security-content" class="flex flex-row gap-4">
          <div
            id="settings-security-password"
            class="flex flex-col gap-4 w-1/2 mr-4"
          >
            <div class="flex flex-row gap-3 items-center">
              <md-icon class="material-outlined">vpn_key</md-icon>
              <h3>{{ $t("settings.security.changePassword") }}</h3>
            </div>
            <div>
              <div class="flex flex-col gap-4">
                <md-outlined-text-field
                  v-model="user.password"
                  type="password"
                  :label="$t('settings.security.currentPassword')"
                  ref="passwordOldField"
                />
                <md-outlined-text-field
                  v-model="passwordNew"
                  type="password"
                  :label="$t('settings.security.newPassword')"
                  ref="passwordNewField"
                  :error-text="$t('settings.security.error.passwordInvalid')"
                />
                <md-outlined-text-field
                  v-model="passwordNewRepeat"
                  type="password"
                  :label="$t('settings.security.confirmPassword')"
                  :error-text="$t('settings.security.error.passwordRepeat')"
                  ref="passwordNewRepeatField"
                  @input="passwordChanged = true"
                />
              </div>
              <!-- <div class="flex flex-row justify-end">
                <md-text-button>{{
                  $t("settings.security.forgotPassword")
                }}</md-text-button>
              </div> -->
              <div
                id="password-error"
                class="error flex hidden font-secondary items-center"
              >
                <md-icon class="mr-1 my-2">error</md-icon>
                <p>{{ $t("settings.security.error.passwordChange") }}</p>
              </div>
            </div>
          </div>
          <div id="settings-security-data" class="flex flex-col gap-4 w-1/2">
            <div class="flex flex-col gap-4">
              <!-- <div class="flex flex-row gap-3 items-center">
                <md-icon class="material-outlined"
                  >supervised_user_circle</md-icon
                >
                <h3>{{ $t("settings.security.albumSharing") }}</h3>
              </div>
              <div class="flex flex-row gap-4">
                <div class="flex flex-col gap-4">
                  <p>{{ $t("settings.security.albumSharingPermissions") }}</p>
                  <md-filter-chip>
                    <md-icon slot="icon">person</md-icon>
                    <p>
                      {{ $t("settings.security.albumSharingPermissionsPublic") }}
                    </p>
                  </md-filter-chip>
                </div>
              </div> -->
              <div class="flex flex-col gap-4">
                <div class="flex flex-row gap-3 items-center">
                  <md-icon class="material-outlined">analytics</md-icon>
                  <h3>{{ $t("settings.security.manageData") }}</h3>
                </div>
                <div class="flex flex-col gap-4">
                  <div class="flex flex-col gap-4">
                    <p>
                      {{ $t("settings.security.deleteAccount.description") }}
                    </p>
                    <AccountDeleteConfirm />
                    <md-filled-button @click="showDeletePopover">
                      <md-icon slot="icon">delete</md-icon>
                      {{
                        $t("settings.security.deleteAccount.button")
                      }}</md-filled-button
                    >
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      id="password-success"
      class="mx-auto success flex hidden font-secondary items-center"
    >
      <md-icon class="mr-1 my-2">check</md-icon>
      <p>{{ $t("settings.security.success.changesSaved") }}</p>
    </div>
    <!-- Dialog to save or cancel changes -->
    <div
      id="settings-save"
      class="dialog p-6 fixed -bottom-1 left-0 right-0 z-10"
    >
      <div class="flex flex-row gap-8 justify-center">
        <md-outlined-button :disabled="!passwordChanged" @click="cancelFunc">
          <md-icon slot="icon">close</md-icon>
          {{ $t("cancel") }}</md-outlined-button
        >
        <md-filled-button
          :disabled="!passwordChanged"
          @click="changePasswordFunc"
        >
          <md-icon slot="icon">save</md-icon>
          {{ $t("saveChanges") }}</md-filled-button
        >
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
  @import "@css/custom-media.css";

  @media (--mobile) {
    #settings {
      #settings-profile-content,
      #settings-security-content {
        flex-direction: column;
        gap: 40px;

        #settings-profile-info {
          margin: 0;
          width: 100%;
          gap: 20px;
        }

        #settings-security-password,
        #settings-security-data {
          margin: 0;
          width: 100%;
        }
      }
    }
    #settings-save div {
      gap: 15px;
    }
  }

  @media (--header-break) {
    #settings {
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding-bottom: 120px;
    }
  }

  #settings-profile,
  #settings-security {
    min-width: 200px;
    width: 100%;

    md-outlined-text-field {
      width: 100%;
    }

    #settings-profile-photo {
      width: 200px;
      aspect-ratio: 1 / 1;
    }
  }

  #settings-save {
    border-radius: 30px 30px 0 0;
  }
</style>
