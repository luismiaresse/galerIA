import { createRouter, createWebHistory } from "vue-router";

// import Home from "@/views/Home.vue";
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

const routes = [
  // {
  //   path: "/",
  //   name: "Home",
  //   component: Home
  // },
  {
    path: "/",
    name: "Photos",
    component: Photos
  },
  {
    path: "/:mediaid",
    name: "PhotoDetail",
    component: PhotoDetail
  },
  {
    path: "/albums/",
    name: "Albums",
    component: Albums
  },
  {
    path: "/albums/:albumid/",
    name: "AlbumDetail",
    component: AlbumDetail
  },
  {
    path: "/albums/:albumid/:mediaid",
    name: "AlbumPhotoDetail",
    component: PhotoDetail
  },
  {
    path: "/shared/",
    name: "Shared",
    component: Shared
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
    component: Auth
  },
  {
    path: "/settings/",
    name: "Settings",
    component: Settings
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
