import { defineStore } from "pinia";

// Store for media ids in photo detail
export const useMediaidsStore = defineStore({
  id: "mediaids",
  state: () => ({
    // First values are newer media, last values are older media
    mediaids: []
  }),
  actions: {
    setMediaids(ids) {
      this.mediaids = ids;
    },
    clearMediaids() {
      this.mediaids = [];
    },
    getPreviousMediaid(id) {
      if (!this.mediaids || this.mediaids.length === 0 || !id) {
        return null;
      }
      const index = this.mediaids.indexOf(Number(id));
      if (index > 0) return this.mediaids[index - 1];
      return null;
    },
    getNextMediaid(id) {
      if (!this.mediaids || this.mediaids.length === 0 || !id) {
        return null;
      }
      const index = this.mediaids.indexOf(Number(id));
      if (index < this.mediaids.length - 1) return this.mediaids[index + 1];
      return null;
    }
  }
});
