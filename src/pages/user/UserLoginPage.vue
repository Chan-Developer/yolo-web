<template>
  <div id="userLoginPage" class="modal">
    <h2 class="title">用户登录</h2>
    <a-form
      style="max-width: 380px; margin: 0 auto"
      :model="formState"
      name="basic"
      label-align="left"
      :label-col="{ span: 4 }"
      :wrapper-col="{ span: 20 }"
      autocomplete="off"
      @finish="handleSubmit"
      @finishFailed="onFinishFailed"
    >
      <a-form-item
        label="账号"
        name="userAccount"
        :rules="[{ required: true, message: '请输入账号!' }]"
      >
        <a-input
          v-model:value="formState.userAccount"
          placeholder="请输入账号"
          size="large"
        />
      </a-form-item>
      <a-form-item
        label="密码"
        name="userPassword"
        :rules="[
          { required: true, message: '请输入密码!' },
          { min: 6, message: '密码不能小于 6 位' },
        ]"
      >
        <a-input-password
          v-model:value="formState.userPassword"
          placeholder="请输入密码"
          size="large"
        />
      </a-form-item>
      <a-form-item
        :wrapper-col="{ span: 24, offset: 0 }"
        class="login-button-form-item"
      >
        <a-button type="primary" html-type="submit" class="submit-btn">
          登录
        </a-button>
      </a-form-item>
      <div class="register-link">
        还没有账号？
        <a @click="goToRegister">去注册</a>
      </div>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import { useLoginUserStore } from "@/store/useLoginUserStore";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";
import { userLogin } from "@/api/user";

interface FormState {
  userAccount: string;
  userPassword: string;
}

const formState = reactive<FormState>({
  userAccount: "",
  userPassword: "",
});

const router = useRouter();
const loginUserStore = useLoginUserStore();

const handleSubmit = async () => {
  try {
    const res = await userLogin({
      userAccount: formState.userAccount,
      userPassword: formState.userPassword,
    });

    if (res.data.code === 0) {
      // 登录成功，用户信息已存在响应中
      loginUserStore.loginUser = res.data.data;
      message.success("登录成功");
      router.push({
        path: "/",
        replace: true,
      });
    } else {
      message.error(res.data.message || "用户名或密码错误");
    }
  } catch (error) {
    message.error("登录失败，请稍后重试");
    console.error(error);
  }
};

const onFinishFailed = (errorInfo: any) => {
  console.log("Failed:", errorInfo);
};

const goToRegister = () => {
  router.push("/user/register");
};
</script>

<style scoped>
#userLoginPage {
  background: #fff;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 380px;
}

.title {
  text-align: center;
  margin-bottom: 16px;
  color: #000;
}

.a-form-item {
  margin-bottom: 15px;
}

.a-form-item label {
  color: #000;
  font-size: 16px;
}

.a-form-item .a-input,
.a-form-item .a-input-password {
  border-radius: 4px;
  border: 1px solid #ccc;
  height: 40px;
  font-size: 14px;
  transition: all 0.3s ease;
}

.a-form-item .a-input:hover,
.a-form-item .a-input-password:hover {
  border-color: #007bff;
  background-color: rgba(0, 123, 255, 0.1);
}

.a-form-item .a-input:focus,
.a-form-item .a-input-password:focus {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
  background-color: #fff;
}

.submit-btn {
  text-align: center;
  border: 0;
  border-radius: 4px;
  color: #fff;
  background-color: #00416a;
  display: block; /* 将元素显示为块级元素,独占一行,可以设置宽高边距等属性 */
  margin: 0 auto;
}

.submit-btn:hover {
  background: #cccccc;
}

.register-link {
  text-align: right;
  margin-top: 16px;
  font-size: 14px;
}

.register-link a {
  color: #00416a;
  cursor: pointer;
}

.register-link a:hover {
  text-decoration: underline;
}

/* 新增样式：使特定表单项的控件内容区域文本居中 */
.login-button-form-item :deep(.ant-form-item-control-input-content) {
  text-align: center;
}
</style>
