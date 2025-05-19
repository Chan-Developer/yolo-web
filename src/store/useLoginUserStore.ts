import { defineStore } from "pinia";
import { getCurrentUser } from "@/api/user";

interface LoginUser {
  id: number;
  username: string;
  userRole: string;
  avatarUrl?: string;
}

export const useLoginUserStore = defineStore("loginUser", {
  state: () => ({
    loginUser: {} as LoginUser,
  }),

  actions: {
    async fetchLoginUser() {
      const res = await getCurrentUser();
      if (res.data.code === 0 && res.data.data) {
        this.loginUser = res.data.data;
      }
    },

    $reset() {
      this.loginUser = {} as LoginUser;
    },
  },
});
