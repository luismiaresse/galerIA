<template>
  <div>
    <RouterLink class="header-element" :to="{ name: routerName }">
      <div style="display: flex; flex-direction: row; align-items: center">
        <md-icon
          :class="{
            'material-symbols-outlined': !checkIfActiveLink(),
            'material-symbols-rounded': checkIfActiveLink(),
          }"
        >
          {{ icon }}
        </md-icon>
        <p>{{ displayName }}</p>
      </div>
      <div class="selected-bottom"></div>
    </RouterLink>
  </div>
</template>

<script>
  import { RouterLink } from "vue-router";

  export default {
    props: ["icon", "routerName", "displayName"],
    components: { RouterLink },
    methods: {
      checkIfActiveLink() {
        return this.$route.name === this.routerName;
      },
    },
  };
</script>

<style scoped>
  .header-element {
    display: flex;
    align-items: center;
    flex-direction: column;
    color: var(--texto-blanco);
    text-decoration: none;
    padding: 0 15px;
    height: 100%;
  }

  .router-link-active,
  .header-element:hover {
    background: var(--gradiente);
    background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .header-element p {
    margin-left: 1rem;
  }

  .selected-bottom {
    border-radius: 4px;
    width: 110%;
    height: 4px;
    background: var(--gradiente);
    margin-top: 1rem;
    visibility: hidden;
  }

  .router-link-active .selected-bottom {
    visibility: visible;
  }
</style>
