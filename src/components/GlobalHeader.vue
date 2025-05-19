<template>
  <div id="globalHeader">
    <a-row :wrap="false">
      <a-col flex="200px">
        <div class="title-bar">
          <i class="fas fa-video logo-icon"></i>
          <div class="title">行人检测系统</div>
        </div>
      </a-col>
      <a-col flex="auto">
        <a-menu
          v-model:selectedKeys="current"
          mode="horizontal"
          :items="menuItems"
          @click="doMenuClick"
        />
      </a-col>
      <a-col flex="80px">
        <div class="user-login-status">
          <a-dropdown v-if="loginUserStore.loginUser.id">
            <div class="user-avatar">
              <a-avatar :size="32" :src="loginUserStore.loginUser.avatarUrl">
                {{
                  !loginUserStore.loginUser.avatarUrl
                    ? loginUserStore.loginUser.username?.[0]?.toUpperCase() ??
                      "U"
                    : ""
                }}
              </a-avatar>
            </div>
            <template #overlay>
              <a-menu>
                <a-menu-item key="logout" @click="handleLogout">
                  <logout-outlined />
                  退出登录
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <div v-else>
            <a-button type="primary" class="login-btn" @click="goToLogin">
              登录
            </a-button>
          </div>
        </div>
      </a-col>
    </a-row>
  </div>
</template>

<script lang="ts" setup>
import { h, ref, computed } from "vue";
import {
  HomeOutlined,
  CrownOutlined,
  CameraOutlined,
  RobotOutlined,
  UploadOutlined,
  LogoutOutlined,
} from "@ant-design/icons-vue";
import { useRouter } from "vue-router";
import { useLoginUserStore } from "@/store/useLoginUserStore";
import { message } from "ant-design-vue";
import { userLogout } from "@/api/user";

const loginUserStore = useLoginUserStore();

const router = useRouter();
// 点击菜单后的路由跳转事件
const doMenuClick = ({ key }: { key: string }) => {
  router.push({
    path: key,
  });
};

const current = ref<string[]>(["mail"]);
// 监听路由变化，更新当前菜单选中状态
router.afterEach((to) => {
  current.value = [to.path];
});

const baseItems = [
  {
    key: "/",
    icon: () => h(HomeOutlined),
    label: "主页",
    title: "主页",
  },
  {
    key: "/admin/userManage",
    icon: () => h(CrownOutlined),
    label: "用户管理",
    title: "用户管理",
    requireLogin: true, // 标记需要登录才显示
  },
  {
    key: "/user/userDetect",
    icon: () => h(CameraOutlined),
    label: "行人检测",
    title: "行人检测",
    // requireLogin: true, // 标记需要登录才显示
  },
  {
    key: "others",
    icon: () => h(RobotOutlined),
    label: h(
      "a",
      { href: "https://chat.deepseek.com/", target: "_blank" },
      "智能助手"
    ),
    title: "智能助手",
  },
  {
    key: "/user/uploadHistory",
    icon: () => h(UploadOutlined),
    label: "上传历史",
    title: "上传历史",
    requireLogin: true, // 标记需要登录才显示
  },
];

// 添加空值检查的计算属性
const currentUser = computed(() => {
  return loginUserStore.loginUser || {}; // 确保始终返回一个对象
});

// 使用计算属性过滤菜单项
const menuItems = computed(() => {
  return baseItems.filter((item) => {
    if (item.requireLogin) {
      return currentUser.value.id;
    }
    return true;
  });
});

const goToLogin = () => {
  router.push("/user/login");
};

const handleLogout = async () => {
  loginUserStore.$reset();
  // 这里需要调用登出API
  const res = await userLogout();
  if (res.data.code !== 0) {
    message.error(res.message || "退出登录失败");
    return;
  }

  message.success("已退出登录");
  setTimeout(() => {
    router.push("/user/login");
  }, 10);
};
</script>

<style scoped>
.title-bar {
  display: flex;
  align-items: center;
}

.logo-icon {
  font-size: 24px;
  color: #00416a;
}

.title {
  color: #00416a;
  font-size: 20px;
  margin-left: 16px;
  font-weight: 600;
}

.user-login-status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  height: 100%;
}

.user-avatar {
  cursor: pointer;
  margin: 4px;
  display: flex;
  align-items: center;
  transition: all 0.3s;
}

.user-avatar:hover {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
}

.login-btn {
  background-color: #00416a !important;
  border-color: #00416a !important;
}

.login-btn:hover {
  background-color: #003152 !important;
  border-color: #003152 !important;
}
</style>
