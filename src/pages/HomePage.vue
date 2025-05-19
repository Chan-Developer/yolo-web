<template>
  <div class="container">
    <div class="left-panel">
      <div class="brand">
        <i class="fas fa-walking"></i>
        <h1>智能行人检测系统</h1>
        <p>让城市更安全，让监控更智能</p>
        <a-button
          type="primary"
          class="start-btn"
          size="large"
          @click="startExperience"
        >
          开始体验
        </a-button>
      </div>
      <div class="features">
        <div
          class="feature-item"
          v-for="(feature, index) in features"
          :key="index"
        >
          <i :class="feature.icon"></i>
          <span>{{ feature.title }}</span>
          <p class="description">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useLoginUserStore } from "@/store/useLoginUserStore";
const router = useRouter();

const startExperience = async () => {
  // 检查是否已登录
  const loginUserStore = useLoginUserStore();
  await loginUserStore.fetchLoginUser();

  if (loginUserStore.loginUser && loginUserStore.loginUser.id) {
    router.push("/user/userDetect");
    return;
  }
  // 如果未登录，跳转到登录页面
  router.push("/user/login");
};

// 在 main.ts 中全局引入
// import "@fortawesome/fontawesome-free/css/all.min.css";

const features = [
  {
    title: "实时检测",
    description: "毫秒级响应，准确识别行人目标",
    icon: "fas fa-search",
  },
  {
    title: "高精度追踪",
    description: "先进算法支持，精准跟踪多目标轨迹",
    icon: "fas fa-location-crosshairs",
  },
  {
    title: "智能分析",
    description: "深度学习技术，提供行为分析与预警",
    icon: "fas fa-chart-line",
  },
];
</script>

<style scoped>
.container {
  display: flex;
  height: calc(100vh - 80px);
  background: linear-gradient(135deg, #00416a, #e4e5e6);
}

.left-panel {
  flex: 1;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: white;
}

.brand {
  text-align: center;
  margin-bottom: 2rem; /* 恢复原来的间距 */
}

.brand i {
  font-size: 3.2rem; /* 从 3rem 增加到 3.2rem */
  margin-bottom: 1rem; /* 从 0.8rem 增加到 1rem */
}

.brand h1 {
  font-size: 2.4rem; /* 从 2.2rem 增加到 2.4rem */
  margin-bottom: 1rem; /* 从 0.8rem 增加到 1rem */
  font-weight: 600;
}

.brand p {
  font-size: 1.3rem; /* 从 1.2rem 增加到 1.3rem */
  opacity: 0.9;
  color: #e4e5e6;
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.8rem; /* 从 1.5rem 增加到 1.8rem */
  margin-top: 2rem; /* 从 1.5rem 增加到 2rem */
  padding: 0 1rem;
}

.feature-item {
  text-align: center;
  padding: 1.4rem; /* 从 1.2rem 增加到 1.4rem */
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  backdrop-filter: blur(10px);
  transition: transform 0.3s ease;
}

.feature-item:hover {
  transform: translateY(-5px);
  background: rgba(255, 255, 255, 0.15);
}

.feature-item i {
  font-size: 2.2rem; /* 从 2rem 增加到 2.2rem */
  margin-bottom: 1rem; /* 从 0.8rem 增加到 1rem */
}

.feature-item span {
  display: block;
  font-size: 1.2rem; /* 从 1.1rem 增加到 1.2rem */
  font-weight: 500;
  margin-bottom: 0.6rem; /* 从 0.5rem 增加到 0.6rem */
}

.feature-item .description {
  font-size: 1rem; /* 从 0.9rem 增加到 1rem */
  opacity: 0.8;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .container {
    min-height: auto;
  }

  .left-panel {
    min-height: auto;
    padding: 2rem;
  }

  .features {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .brand i {
    font-size: 3rem;
  }

  .brand h1 {
    font-size: 2rem;
  }

  .brand p {
    font-size: 1rem;
  }
}

.start-btn {
  margin-top: 2rem;
  padding: 0 2rem;
  height: 48px;
  font-size: 1.2rem;
  background: #00416a;
  border-color: #00416a;
  transition: all 0.3s ease;
}

.start-btn:hover {
  background: #003152;
  border-color: #003152;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 65, 106, 0.3);
}
</style>
