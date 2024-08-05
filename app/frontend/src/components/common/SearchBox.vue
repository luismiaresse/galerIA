<script setup lang="ts">
  import { ref } from "vue";
  import { useI18n } from "vue-i18n";

  const focused = ref(false);
  const hovered = ref(false);
  const searchText = ref("");
  const $t = useI18n().t;
  const emit = defineEmits(["filter"]);
  const searchbox = ref();

  // Auto search when text is entered after 500ms
  const searchFunc = () => {
    setTimeout(() => {
      emit("filter", searchText.value);
    }, 600);
  };

  // Bind Ctrl+F to focus the search field and prevent the browser's search
  window.onkeydown = (e) => {
    if (e.ctrlKey && e.key === "f") {
      // Prevent the browser's search
      e.preventDefault();
      // Render and focus the search field
      focusEnterFunc();
    } else if (e.key === "Escape") {
      focusLeaveFunc();
    }
  };

  const focusEnterFunc = () => {
    focused.value = true;
    // Keep width of search field constant
    $("#searchbox").css("width", "470px");
    setTimeout(() => {
      $("#search-field").trigger("focus");
    }, 100);
  };

  const focusLeaveFunc = () => {
    if (searchText.value === "") {
      focused.value = false;
      hovered.value = false;
      $("#searchbox").css("width", "120px");
    }
  };

  const hoverEnterFunc = () => {
    hovered.value = true;
    $("#searchbox").css("width", "470px");
  };

  const hoverLeaveFunc = () => {
    if (!focused.value && searchText.value === "") {
      hovered.value = false;
      $("#searchbox").css("width", "120px");
    }
  };
</script>

<template>
  <div
    id="search"
    class="grow-left h-fit w-fit"
    @click="focusEnterFunc"
    @focusout="focusLeaveFunc"
    @mouseenter="hoverEnterFunc"
    @mouseleave="hoverLeaveFunc"
  >
    <div
      id="searchbox"
      class="dialog right-8 p-4 cursor-pointer flex flex-row items-center"
      ref="searchbox"
    >
      <md-icon class="mr-4">search</md-icon>
      <span v-if="!focused && !hovered" class="text-primary">{{
        $t("search")
      }}</span>
      <textarea
        v-else
        id="search-field"
        class="overflow-ellipsis overflow-hidden whitespace-nowrap w-full"
        type="text"
        autocomplete="off"
        v-model="searchText"
        @blur="focused = false"
        @input="searchFunc"
        :placeholder="$t('searchPlaceholder')"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
  @import "@css/custom-media.css";

  @media (--header-break) {
    #search {
      margin: 10px auto;
      #searchbox {
        max-width: 90dvw;
      }
    }
  }

  #search {
    #searchbox {
      transition: all, 0.5s;
      width: 120px;
      height: 50px;
    }

    #search-field {
      background-color: var(--fondo-oscuro);
      color: var(--texto-blanco);
      height: auto;
      max-height: 48px;
      resize: none;
      // New property, not supported by all browsers yet
      field-sizing: content;

      &:focus {
        outline: none;
      }
    }
  }
</style>
