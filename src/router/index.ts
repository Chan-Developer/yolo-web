import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import BasicLayout from "@/layouts/BasicLayout.vue";
import HomePage from "@/pages/HomePage.vue";
import UserLoginPage from "@/pages/user/UserLoginPage.vue";
import UserRegisterPage from "@/pages/user/UserRegisterPage.vue";
import UserManagePage from "@/pages/admin/UserManagePage.vue";
import UserDetectPage from "@/pages/user/UserDetectPage.vue";
import UserUploadHistoryPage from "@/pages/user/UserUploadHistoryPage.vue";
import { useLoginUserStore } from "@/store/useLoginUserStore";
import { message } from "ant-design-vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    component: BasicLayout,
    children: [
      {
        path: "/",
        component: HomePage,
        meta: { requireAuth: false },
      },
      {
        path: "/user/login",
        component: UserLoginPage,
        meta: { requireAuth: false },
      },
      {
        path: "/user/register",
        component: UserRegisterPage,
        meta: { requireAuth: false },
      },
      {
        path: "/admin/userManage",
        component: UserManagePage,
        meta: {
          requireAuth: true,
          // requireAdmin: true,
        },
      },
      {
        path: "/user/userDetect",
        component: UserDetectPage,
        meta: {
          requireAuth: false,
          requireAuthToOperate: true,
        },
      },
      {
        path: "/user/uploadHistory",
        component: UserUploadHistoryPage,
        meta: {
          requireAuth: true,
        },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

// 添加路由守卫
router.beforeEach(async (to, from, next) => {
  // 如果是公开页面，不需要检查用户状态
  if (!to.meta.requireAuth && !to.meta.requireAuthToOperate) {
    next();
    return;
  }

  const loginUserStore = useLoginUserStore();

  try {
    // 尝试获取用户信息，如果尚未获取
    if (!loginUserStore.loginUser || !loginUserStore.loginUser.id) {
      await loginUserStore.fetchLoginUser();
    }

    // 再次检查用户信息是否存在 (可能是因为API调用失败)
    if (!loginUserStore.loginUser || !loginUserStore.loginUser.id) {
      // 如果页面需要登录才能访问
      if (to.meta.requireAuth) {
        next({ path: "/user/login", query: { redirect: to.fullPath } });
        return;
      }
      // 如果只是操作需要登录，但可以访问页面
      else if (to.meta.requireAuthToOperate) {
        next(); // 允许访问，但操作会被限制
        return;
      }
    }

    // 如果用户已登录且具有权限
    next();
  } catch (error) {
    console.error("获取用户信息失败:", error);
    // 如果页面需要登录权限
    if (to.meta.requireAuth) {
      next({ path: "/user/login", query: { redirect: to.fullPath } });
    } else {
      next(); // 允许访问公开页面
    }
  }
});

export default router;
