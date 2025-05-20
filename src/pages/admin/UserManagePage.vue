<template>
  <div id="userManagePage">
    <div class="operation-bar">
      <h2>用户管理</h2>
      <div class="search-bar">
        <a-input-search
          v-model:value="searchText"
          placeholder="请输入用户名搜索"
          style="width: 200px"
          @search="handleSearch"
        />
        <a-button type="primary" @click="showAddUserModal">添加用户</a-button>
      </div>
    </div>

    <a-table :dataSource="users" :columns="columns" rowKey="id">
      <template #bodyCell="{ column, record }">
        <template v-if="column.key === 'action'">
          <a-button type="link" @click="showEditUserModal(record)"
            >编辑</a-button
          >
          <a-popconfirm
            title="确定要删除这个用户吗?"
            ok-text="确定"
            cancel-text="取消"
            @confirm="handleDeleteUser(record.id)"
          >
            <a-button type="link" danger>删除</a-button>
          </a-popconfirm>
        </template>
      </template>
    </a-table>

    <!-- 添加/编辑用户模态框 -->
    <a-modal
      :title="modalTitle"
      v-model:visible="modalVisible"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
    >
      <a-form
        :model="userForm"
        :label-col="{ span: 4 }"
        :wrapper-col="{ span: 20 }"
      >
        <a-form-item
          label="用户名"
          name="userAccount"
          :rules="[
            { required: true, message: '请输入用户名!' },
            { min: 6, message: '用户名不能小于 6 位' },
            { max: 16, message: '用户名不能大于 16 位' },
          ]"
        >
          <a-input v-model:value="userForm.userAccount" />
        </a-form-item>

        <a-form-item
          label="密码"
          name="userPassword"
          :rules="[
            { required: isAddMode, message: '请输入密码!' },
            { min: 8, message: '密码不能小于 8 位' },
            { max: 16, message: '密码不能大于 16 位' },
          ]"
        >
          <a-input-password v-model:value="userForm.userPassword" />
        </a-form-item>

        <a-form-item label="角色" name="userRole">
          <a-select :value="userForm.userRole">
            <a-select-option :value="1">管理员</a-select-option>
            <a-select-option :value="0">普通用户</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { message } from "ant-design-vue";
import {
  searchUsers,
  deleteUser,
  findAllUser,
  addUser,
  updateUser,
} from "@/api/user";
// import { min } from "date-fns";
import { useLoginUserStore } from "@/store/useLoginUserStore";
import { useRouter } from "vue-router";

const users = ref([]);
const searchText = ref("");
const modalVisible = ref(false);
const isAddMode = ref(true);
const userForm = ref({
  id: undefined,
  userAccount: "",
  userPassword: "",
  userRole: 0,
});

const modalTitle = computed(() => (isAddMode.value ? "添加用户" : "编辑用户"));

const router = useRouter();

// 获取所有用户
const loadUsers = async () => {
  try {
    const response = await findAllUser(searchText.value);
    if (response.data && response.data.code === 0) {
      users.value = response.data.data || [];
    } else {
      message.error(response.data?.message || "获取用户列表失败");
    }
  } catch (error) {
    console.error("获取用户列表出错:", error);
    message.error("获取用户列表出错");
  }
};

// 搜索用户
const handleSearch = async () => {
  try {
    const response = await searchUsers(searchText.value);
    if (response.data && response.data.code === 0) {
      users.value = response.data.data || [];
    } else {
      message.error(response.data?.message || "搜索用户失败");
    }
  } catch (error) {
    console.error("搜索用户出错:", error);
    message.error("搜索用户出错");
  }
};

// 删除用户
const handleDeleteUser = async (id) => {
  if (!id) {
    message.error("用户ID不能为空");
    return;
  }
  // 不能删除自己的账户
  const loginUserStore = useLoginUserStore();
  if (loginUserStore.loginUser && loginUserStore.loginUser.id === id) {
    message.error("不能删除自己的账户");
    return;
  }
  try {
    const response = await deleteUser(id);
    if (response.data && response.data.code === 0) {
      message.success("删除成功");

      // 判断是否删除的是当前登录用户
      const loginUserStore = useLoginUserStore();
      if (loginUserStore.loginUser && loginUserStore.loginUser.id === id) {
        // 如果删除的是当前登录用户，清除登录状态并重定向
        loginUserStore.$reset();
        router.push("/user/login");
      } else {
        // 如果不是当前用户，仅重新加载用户列表
        loadUsers();
      }
    } else {
      message.error(response.data?.message || "删除用户失败");
    }
  } catch (error) {
    console.error("删除用户出错:", error);
    message.error("删除用户出错");
  }
};

// 显示添加用户模态框
const showAddUserModal = () => {
  isAddMode.value = true;
  userForm.value = {
    id: undefined,
    userAccount: "",
    userPassword: "",
    userRole: 0,
  };
  modalVisible.value = true;
};

// 显示编辑用户模态框
const showEditUserModal = (record) => {
  isAddMode.value = false;
  userForm.value = {
    id: record.id,
    userAccount: record.userAccount,
    userPassword: "", // 编辑用户时不回显密码
    userRole: record.userRole !== undefined ? record.userRole : 0,
  };
  modalVisible.value = true;
};

// 处理模态框确认
const handleModalOk = async () => {
  // 验证用户名长度
  if (
    userForm.value.userAccount.length < 6 ||
    userForm.value.userAccount.length > 16
  ) {
    message.error("用户名长度必须在 6 到 16 位之间");
    return;
  }
  // 验证密码长度
  if (
    userForm.value.userPassword.length < 8 ||
    userForm.value.userPassword.length > 16
  ) {
    message.error("密码长度必须在 8 到 16 位之间");
    return;
  }

  if (!userForm.value.userAccount) {
    message.error("用户名不能为空");
    return;
  }

  if (isAddMode.value && !userForm.value.userPassword) {
    message.error("密码不能为空");
    return;
  }

  try {
    // 创建一个新对象用于API请求
    const userData = { ...userForm.value };

    let response;

    if (isAddMode.value) {
      response = await addUser(userData);
    } else {
      // 如果没有修改密码，不传递密码字段
      if (!userData.userPassword) {
        delete userData.userPassword;
      }
      response = await updateUser(userData);
    }

    if (response.data && response.data.code === 0) {
      message.success(isAddMode.value ? "添加成功" : "更新成功");
      modalVisible.value = false;
      loadUsers(); // 重新加载用户列表
    } else {
      message.error(
        response.data?.message ||
          (isAddMode.value ? "添加用户失败" : "更新用户失败")
      );
    }
  } catch (error) {
    console.error(isAddMode.value ? "添加用户出错:" : "更新用户出错:", error);
    message.error(isAddMode.value ? "添加用户出错" : "更新用户出错");
  }
};

// 处理模态框取消
const handleModalCancel = () => {
  modalVisible.value = false;
};

const columns = [
  {
    title: "ID",
    dataIndex: "id",
    key: "id",
  },
  {
    title: "用户名",
    dataIndex: "userAccount",
    key: "userAccount",
  },
  {
    title: "角色",
    dataIndex: "userRole",
    key: "userRole",
    customRender: ({ text }) => {
      return text === 1 ? "管理员" : "普通用户";
    },
  },
  {
    title: "创建时间",
    dataIndex: "createTime",
    key: "createTime",
  },
  {
    title: "操作",
    key: "action",
  },
];

// 页面加载时获取用户列表
onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
#userManagePage {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
}

.operation-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.search-bar {
  display: flex;
  gap: 16px;
}
</style>
