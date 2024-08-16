import { createRouter, createWebHistory } from "vue-router";

import Photos from "@/views/Photos.vue";
import Albums from "@/views/Albums.vue";
import AlbumDetail from "@/views/AlbumDetail.vue";
import Shared from "@/views/Shared.vue";
import Create from "@/views/Create.vue";
import About from "@/views/About.vue";
import Auth from "@/views/Auth.vue";
import Settings from "@/views/Settings.vue";
import NotFound from "@/views/NotFound.vue";
import PhotoDetail from "@/views/PhotoDetail.vue";
import { checkAuthRouter } from "./auth";
import Test from "@/views/Test.vue";

const routes = [
  {
    path: "/",
    name: "Photos",
    component: Photos,
    beforeEnter: checkAuthRouter
  },
  {
    path: "/:mediaid",
    name: "PhotoDetail",
    component: PhotoDetail,
    beforeEnter: checkAuthRouter
  },
  {
    path: "/albums/",
    name: "Albums",
    component: Albums,
    beforeEnter: checkAuthRouter
  },
  {
    path: "/albums/:albumid/",
    name: "AlbumDetail",
    component: AlbumDetail,
    beforeEnter: checkAuthRouter
  },
  {
    path: "/albums/:albumid/:mediaid",
    name: "AlbumPhotoDetail",
    component: PhotoDetail,
    beforeEnter: checkAuthRouter
  },
  {
    path: "/shared/",
    name: "Shared",
    component: Shared,
    beforeEnter: checkAuthRouter
  },
  {
    path: "/create/",
    name: "Create",
    component: Create
  },
  {
    path: "/about/",
    name: "About",
    component: About
  },
  {
    path: "/auth/",
    name: "Auth",
    component: Auth,
    beforeEnter: checkAuthRouter
  },
  {
    path: "/settings/",
    name: "Settings",
    component: Settings,
    beforeEnter: checkAuthRouter
  },
  {
    path: "/test/",
    name: "Test",
    component: Test
  },
  // Any other route gets 404 page
  {
    path: "/:catchAll(.*)",
    name: "NotFound",
    component: NotFound
  }
];

const router = createRouter({
  history: createWebHistory("/"),
  routes
});

export default router;
