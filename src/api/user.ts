import myAxios from "@/request";

/**
 * 用户注册
 * @param params
 */
export const userRegister = async (params: any) => {
  return myAxios.request({
    url: "/api/user/register",
    method: "POST",
    data: params,
  });
};

/**
 * 用户登录
 * @param params
 */
export const userLogin = async (params: any) => {
  return myAxios.request({
    url: "/api/user/login",
    method: "POST",
    data: params,
  });
};

/**
 * 用户注销
 * @param params
 */
export const userLogout = async (params: any) => {
  return myAxios.request({
    url: "/api/user/logout",
    method: "POST",
    data: params,
  });
};

/**
 * 获取当前用户
 */
export const getCurrentUser = async () => {
  return myAxios.request({
    url: "/api/user/current",
    method: "GET",
  });
};

/**
 * 获取用户列表
 * @param username
 */
export const searchUsers = async (username: any) => {
  return myAxios.request({
    url: "/api/user/search",
    method: "GET",
    params: {
      username,
    },
  });
};

/**
 * 删除用户
 * @param id
 */
export const deleteUser = async (id: string) => {
  return myAxios.request({
    url: "/api/user/delete",
    method: "POST",
    data: id,
    // 关键点：要传递 JSON 格式的值
    headers: {
      "Content-Type": "application/json",
    },
  });
};

/**
 * 更新用户
 * @param params
 */
export const updateUser = async (params: any) => {
  return myAxios.request({
    url: "/api/user/edit",
    method: "POST",
    data: params,
  });
};

/**
 * 增加用户
 * @param params
 */
export const addUser = async (params: any) => {
  return myAxios.request({
    url: "/api/user/add",
    method: "POST",
    data: params,
  });
};

/**
 * 查找所有用户
 * @param id
 */
export const findAllUser = async (searchText: string) => {
  return myAxios.request({
    url: "/api/user/list",
    method: "GET",
  });
};

/**
 * 获取用户上传历史
 * @param params 可选查询参数 (可能包括分页信息等)
 */
export const getUserUploadHistory = async (params?: any) => {
  return myAxios.request({
    url: "/api/user/upload/history",
    method: "GET",
    params,
  });
};

/**
 * 删除上传历史记录
 * @param id 记录ID
 */
export const deleteUploadHistory = async (id: number) => {
  return myAxios.request({
    url: "/api/user/upload/history/delete",
    method: "POST",
    data: { id },
  });
};
