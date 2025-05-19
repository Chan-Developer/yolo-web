<template>
  <div id="userRegisterPage" class="modal">
    <h2 class="title">用户注册</h2>
    <a-form
      style="max-width: 480px; margin: 0 auto"
      :model="formState"
      name="basic"
      label-align="left"
      :label-col="{ span: 5 }"
      :wrapper-col="{ span: 20 }"
      autocomplete="off"
      @finish="handleSubmit"
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
        label="确认密码"
        name="checkPassword"
        :rules="[
          { required: true, message: '请输入确认密码!' },
          { min: 6, message: '确认密码不能小于 6 位' },
        ]"
      >
        <a-input-password
          v-model:value="formState.checkPassword"
          placeholder="请输入确认密码"
          size="large"
        />
      </a-form-item>

      <a-form-item :wrapper-col="{ offset: 5, span: 20 }">
        <a-button type="primary" html-type="submit" class="submit-btn"
          >注册</a-button
        >
      </a-form-item>
    </a-form>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from "vue";
import { userRegister } from "@/api/user";
import { message } from "ant-design-vue";
import { useRouter } from "vue-router";

interface FormState {
  userAccount: string;
  userPassword: string;
  checkPassword: string;
}

const formState = reactive<FormState>({
  userAccount: "",
  userPassword: "",
  checkPassword: "",
});

const router = useRouter();

const handleSubmit = async (values: FormState) => {
  if (formState.userPassword !== formState.checkPassword) {
    message.error("两次输入的密码不一致");
    return;
  }

  const res = await userRegister(values);

  if (res.data.code === 0 && res.data.data) {
    message.success("注册成功");
    router.push({
      path: "/user/login",
      replace: true,
    });
  } else {
    message.error("注册失败，" + res.data.description);
  }
};
</script>

<style scoped>
#userRegisterPage {
  background: #fff;
  border-radius: 8px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 480px;
}

.title {
  text-align: center;
  margin-bottom: 16px;
  color: #000;
}

.submit-btn {
  text-align: center;
  border: 0;
  border-radius: 4px;
  color: #fff;
  background-color: #00416a;
  display: block;
  margin: 0 auto;
}

.submit-btn:hover {
  background: #cccccc;
}

/* 添加输入框样式，与登录页面保持一致 */
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
</style>
