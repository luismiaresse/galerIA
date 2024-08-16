import { defineStore } from "pinia";

// Create user info store
export const useUserStore = defineStore({
  id: "user",
  // User object with username, email and photo
  state: () => ({
    user: null
  }),
  actions: {
    setUser(userData) {
      this.user = userData;
    },
    clearUser() {
      this.user = null;
    },
    isUserSet() {
      // Check if all properties are set
      if (!this.user) return false;
      if (!this.user.username) return false;
      if (!this.user.email) return false;
      return true;
    }
  }
});
