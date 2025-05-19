const { defineConfig } = require("@vue/cli-service");
module.exports = defineConfig({
  transpileDependencies: true,
  devServer: {
    proxy: {
      "/api": {
        // 这里的'/api'是请求前缀
        target: "http://localhost:8080", // 后端地址
        changeOrigin: true, // 允许跨域
        pathRewrite: {
          "^/api": "", // 重写路径
        },
      },
    },
    client: {
      overlay: false,
    },
  },
});
