<template>
  <!-- 添加下载确认对话框 -->
  <a-modal
    v-model:visible="downloadModalVisible"
    title="下载提示"
    :closable="false"
    :maskClosable="false"
    :keyboard="false"
  >
    <template #footer>
      <a-button key="back" @click="cancelDownload">取消</a-button>
      <a-button
        key="submit"
        type="primary"
        :loading="downloading"
        @click="confirmDownload"
      >
        {{ downloading ? "下载中..." : "确认下载" }}
      </a-button>
    </template>
    <p>视频处理完成，是否立即下载？</p>
    <p style="color: #999; font-size: 14px">文件名：{{ downloadFileName }}</p>
  </a-modal>

  <div class="error-banner" v-if="errorMessage">
    <a-alert
      type="error"
      :message="errorMessage"
      banner
      closable
      @close="errorMessage = ''"
    />
  </div>

  <div class="detect-page">
    <div class="detect-content">
      <div class="detect-header">
        <h2>行人检测</h2>
        <p class="description">基于深度学习的智能行人检测系统</p>
      </div>

      <div class="detect-main">
        <div class="video-container">
          <!-- 添加加载状态包装 -->
          <div
            v-if="!fileUrl && !processedImageUrl && !streamActive"
            class="upload-area"
          >
            <a-upload
              accept=".jpg,.jpeg,.png,.mp4"
              :show-upload-list="false"
              :before-upload="beforeUpload"
              :customRequest="customUpload"
            >
              <div class="upload-trigger">
                <upload-outlined />
                <p>点击上传视频或图片</p>
                <p class="upload-hint">支持 mp4, jpg, png 格式</p>
              </div>
            </a-upload>
          </div>
          <!-- 原始文件预览 -->
          <div
            v-else-if="fileUrl && !processedImageUrl && !streamActive"
            class="preview-area"
          >
            <video
              v-if="fileType === 'video'"
              :src="fileUrl"
              controls
              class="preview-content"
            ></video>
            <img v-else :src="fileUrl" class="preview-content" />
          </div>
          <!-- 处理后的图片预览 -->
          <div
            v-else-if="processedImageUrl && !streamActive"
            class="preview-area"
          >
            <img
              :src="processedImageUrl"
              class="preview-content"
              @error="handleImageError"
            />
          </div>
          <!-- 流式视频预览 -->
          <div v-else-if="streamActive" class="preview-area">
            <canvas
              ref="canvasElement"
              width="640"
              height="360"
              class="preview-content"
            ></canvas>
          </div>
        </div>

        <div class="control-panel">
          <a-button
            @click="resetFile"
            v-if="fileUrl || processedImageUrl || streamActive"
          >
            重新上传
          </a-button>
          <a-button
            type="primary"
            @click="processVideo"
            v-if="
              fileUrl &&
              fileType === 'video' &&
              !streamActive &&
              !processedImageUrl
            "
          >
            开始处理
          </a-button>
          <a-select
            v-if="fileType === 'video' && !streamActive && !processedImageUrl"
            v-model:value="processMethod"
            style="width: 200px"
          >
            <a-select-option value="streaming">实时流处理</a-select-option>
            <a-select-option value="complete"
              >完整处理（后下载）</a-select-option
            >
          </a-select>
        </div>

        <div class="result-panel" v-if="detectionResult">
          <h3>检测结果</h3>
          <div class="result-content">
            <p>检测到的行人数量：{{ detectionResult.count }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onBeforeUnmount } from "vue";
import { message } from "ant-design-vue";
import { UploadOutlined } from "@ant-design/icons-vue";
import type { UploadRequestOption } from "ant-design-vue/es/vc-upload/interface";
import axios from "axios";

const fileUrl = ref<string>("");
const processedImageUrl = ref<string>("");
const fileType = ref<"image" | "video">("image");
const detectionResult = ref<{ count: number } | null>(null);

// 添加新的响应式变量
const downloadModalVisible = ref(false);
const downloading = ref(false);
const downloadFileName = ref("");
const pendingDownload = ref<{ url: string; filename: string } | null>(null);

// 添加处理状态变量
const processing = ref(false);
const streamActive = ref(false);

// 添加视频和画布元素引用
const canvasElement = ref<HTMLCanvasElement | null>(null);
const fileObject = ref<File | null>(null);
const processMethod = ref<"streaming" | "complete">("streaming");

// WebSocket 连接
let socket: WebSocket | null = null;
const clientId = ref(
  `client_${Date.now()}_${Math.floor(Math.random() * 1000)}`
);

// Add a ref for error message display
const errorMessage = ref("");

// Add a function to validate the video file
const validateVideoFile = async (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    // Create a video element to test if the file can be played
    const video = document.createElement("video");
    video.preload = "metadata";

    const objectUrl = URL.createObjectURL(file);

    // Set up event listeners
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(true); // Video seems valid
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(false); // Video has issues
    };

    // Try to load the video
    video.src = objectUrl;
  });
};

const beforeUpload = async (file: File) => {
  const isVideo = file.type === "video/mp4";
  const isImage = file.type === "image/jpeg" || file.type === "image/png";

  if (!isVideo && !isImage) {
    message.error("请上传 mp4 视频或 jpg/png 图片!");
    return false;
  }

  const isLt100M = file.size / 1024 / 1024 < 100;
  if (!isLt100M) {
    message.error("文件必须小于 100MB!");
    return false;
  }

  // If it's a video, validate it
  if (isVideo) {
    const isValidVideo = await validateVideoFile(file);
    if (!isValidVideo) {
      errorMessage.value = "视频文件格式有问题，请使用正确的MP4格式";
      message.error("视频文件格式有问题，请使用正确的MP4格式");
      return false;
    }
  }

  fileType.value = isVideo ? "video" : "image";
  return true;
};

const customUpload = async (options: UploadRequestOption) => {
  const { file } = options;
  if (!file || !(file instanceof File)) return;

  fileObject.value = file;

  // 为图片和视频创建预览
  fileUrl.value = URL.createObjectURL(file);

  if (fileType.value === "image") {
    // 自动处理图片
    await processImage(file);
  }
  // 视频需要用户点击"开始处理"按钮
};

const processImage = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  try {
    processing.value = true;
    message.loading({ content: "正在处理图片...", key: "processing" });

    const response = await axios.post(
      "http://localhost:8000/detect",
      formData,
      {
        responseType: "blob",
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const imageBlob = new Blob([response.data], { type: "image/jpeg" });
    if (imageBlob.size === 0) {
      throw new Error("接收到空的响应数据");
    }

    if (processedImageUrl.value) {
      URL.revokeObjectURL(processedImageUrl.value);
    }

    processedImageUrl.value = URL.createObjectURL(imageBlob);
    message.success({ content: "图片处理完成!", key: "processing" });
  } catch (error) {
    message.error({
      content: (error as Error).message || "图片处理失败",
      key: "processing",
    });
    console.error("Error:", error);
  } finally {
    processing.value = false;
  }
};

const processVideo = async () => {
  if (!fileObject.value) return;

  if (processMethod.value === "streaming") {
    await startStreamProcessing();
  } else {
    await startCompleteProcessing();
  }
};

const startStreamProcessing = async () => {
  if (!fileObject.value) return;

  try {
    processing.value = true;
    streamActive.value = true;
    message.loading({ content: "准备视频流处理...", key: "processing" });

    // 先上传视频文件
    const formData = new FormData();
    formData.append("file", fileObject.value);

    const uploadResponse = await axios.post(
      "http://localhost:8000/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    const filePath = uploadResponse.data.file_path;

    // 建立WebSocket连接进行流处理
    socket = new WebSocket(
      `ws://localhost:8000/video-stream/${clientId.value}`
    );

    let connectionTimeout = setTimeout(() => {
      if (socket?.readyState !== WebSocket.OPEN) {
        errorMessage.value = "WebSocket连接超时，请重试";
        message.error("WebSocket连接超时，请重试");
        if (socket) socket.close();
        processing.value = false;
        streamActive.value = false;
      }
    }, 10000); // 10秒超时

    socket.onopen = () => {
      clearTimeout(connectionTimeout);
      console.log("WebSocket connection established");
      // 发送文件路径信息
      socket.send(JSON.stringify({ file_path: filePath }));
      message.success({ content: "开始视频流处理", key: "processing" });
    };

    // Track if we've received any frames
    let framesReceived = 0;
    let noFramesTimeout = setTimeout(() => {
      if (framesReceived === 0 && socket?.readyState === WebSocket.OPEN) {
        errorMessage.value = "没有收到视频帧，可能是视频文件格式问题";
        message.error("没有收到视频帧，可能是视频文件格式问题");
        if (socket) socket.close();
        processing.value = false;
        streamActive.value = false;
      }
    }, 15000); // 15秒内没收到帧就报错

    socket.onmessage = (event) => {
      // 检查是否是二进制数据（帧）或是JSON消息
      if (event.data instanceof Blob) {
        // 收到帧，清除超时
        clearTimeout(noFramesTimeout);
        framesReceived++;

        // 处理视频帧
        const frameBlob = event.data;
        const frameUrl = URL.createObjectURL(frameBlob);

        // 在canvas上绘制帧
        const img = new Image();
        img.onload = () => {
          if (canvasElement.value) {
            const ctx = canvasElement.value.getContext("2d");
            if (ctx) {
              ctx.drawImage(
                img,
                0,
                0,
                canvasElement.value.width,
                canvasElement.value.height
              );
            }
            URL.revokeObjectURL(frameUrl); // 清理
          }
        };
        img.src = frameUrl;
      } else {
        // 处理JSON消息
        try {
          const jsonData = JSON.parse(event.data);
          if (jsonData.message === "视频处理完成") {
            message.success({ content: "视频流处理完成!", key: "processing" });
            processing.value = false;
          } else if (jsonData.error) {
            errorMessage.value = jsonData.error;
            message.error({ content: jsonData.error, key: "processing" });
            processing.value = false;
          }
        } catch (e) {
          console.error("Failed to parse JSON message:", e);
        }
      }
    };

    socket.onerror = (error) => {
      clearTimeout(connectionTimeout);
      clearTimeout(noFramesTimeout);
      console.error("WebSocket error:", error);
      errorMessage.value = "WebSocket连接出错，请检查服务器状态";
      message.error({
        content: "WebSocket连接出错",
        key: "processing",
      });
      processing.value = false;
      streamActive.value = false;
    };

    socket.onclose = (event) => {
      clearTimeout(connectionTimeout);
      clearTimeout(noFramesTimeout);
      console.log("WebSocket connection closed", event);

      if (event.code !== 1000 && event.code !== 1001) {
        // 非正常关闭
        errorMessage.value = `连接异常关闭 (${event.code})，可能是视频文件格式问题`;
        message.error("连接异常关闭，可能是视频文件格式问题");
      } else if (processing.value) {
        message.success({
          content: "视频流处理完成!",
          key: "processing",
        });
      }

      processing.value = false;
      streamActive.value = false;
    };
  } catch (error) {
    errorMessage.value = (error as Error).message || "视频流处理失败";
    message.error({
      content: (error as Error).message || "视频流处理失败",
      key: "processing",
    });
    console.error("Error:", error);
    processing.value = false;
    streamActive.value = false;
  }
};

const startCompleteProcessing = async () => {
  if (!fileObject.value) return;

  const formData = new FormData();
  formData.append("file", fileObject.value);

  try {
    processing.value = true;
    message.loading({ content: "正在处理视频...", key: "processing" });

    const response = await axios.post(
      "http://localhost:8000/detect",
      formData,
      {
        responseType: "blob",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 180000, // 3分钟超时
      }
    );

    if (response.data.size === 0) {
      throw new Error("处理后的视频数据为空");
    }

    // 检查响应头是否含有错误信息
    const contentType = response.headers["content-type"];
    if (contentType && contentType.includes("application/json")) {
      // 可能是错误响应
      const reader = new FileReader();
      reader.onload = function () {
        try {
          const jsonResponse = JSON.parse(reader.result as string);
          if (jsonResponse.detail) {
            errorMessage.value = jsonResponse.detail;
            message.error(jsonResponse.detail);
          }
        } catch (e) {
          console.error("Failed to parse error response", e);
        }
      };
      reader.readAsText(response.data);
      throw new Error("处理视频时发生错误");
    }

    const blob = new Blob([response.data], { type: "video/mp4" });
    const downloadUrl = window.URL.createObjectURL(blob);

    downloadFileName.value = `processed_${fileObject.value.name}`;
    pendingDownload.value = {
      url: downloadUrl,
      filename: downloadFileName.value,
    };
    downloadModalVisible.value = true;

    message.success({ content: "视频处理完成!", key: "processing" });
  } catch (error) {
    if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
      errorMessage.value = "处理视频超时，请检查视频文件";
    } else {
      errorMessage.value = (error as Error).message || "视频处理失败";
    }

    message.error({
      content: (error as Error).message || "视频处理失败",
      key: "processing",
    });
    console.error("Error:", error);
  } finally {
    processing.value = false;
  }
};

// 添加下载确认和取消函数
const confirmDownload = async () => {
  if (!pendingDownload.value) return;
  downloading.value = true;
  try {
    const { url, filename } = pendingDownload.value;
    const link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    message.success("开始下载视频");
  } catch (error) {
    message.error("下载失败");
    console.error("Download error:", error);
  } finally {
    downloading.value = false;
    downloadModalVisible.value = false;
    // 清理资源
    if (pendingDownload.value) {
      window.URL.revokeObjectURL(pendingDownload.value.url);
      pendingDownload.value = null;
    }
  }
};

const cancelDownload = () => {
  // 清理资源
  if (pendingDownload.value) {
    window.URL.revokeObjectURL(pendingDownload.value.url);
    pendingDownload.value = null;
  }
  downloadModalVisible.value = false;
  message.info("已取消下载");
};

const resetFile = () => {
  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value);
  }
  if (processedImageUrl.value) {
    URL.revokeObjectURL(processedImageUrl.value);
  }

  // 关闭WebSocket连接
  if (socket) {
    socket.close();
    socket = null;
  }

  fileUrl.value = "";
  processedImageUrl.value = "";
  fileType.value = "image";
  detectionResult.value = null;
  fileObject.value = null;
  streamActive.value = false;
  errorMessage.value = ""; // Clear any error messages
};

// 添加图片加载错误处理
const handleImageError = (e: Event) => {
  console.error("Image failed to load:", e);
  message.error("图片加载失败");
};

// 组件卸载前清理资源
onBeforeUnmount(() => {
  if (socket) {
    socket.close();
  }

  if (fileUrl.value) {
    URL.revokeObjectURL(fileUrl.value);
  }

  if (processedImageUrl.value) {
    URL.revokeObjectURL(processedImageUrl.value);
  }

  if (pendingDownload.value) {
    window.URL.revokeObjectURL(pendingDownload.value.url);
  }
});
</script>

<style scoped>
.detect-page {
  position: relative;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  min-height: calc(100vh - 180px);
}

.detect-header {
  text-align: center;
  margin-bottom: 32px;
}

.detect-header h2 {
  font-size: 24px;
  color: #00416a;
  margin-bottom: 8px;
}

.description {
  color: #666;
  font-size: 16px;
}

.detect-main {
  max-width: 1200px;
  margin: 0 auto;
}

.video-container {
  background: #f5f5f5;
  border-radius: 8px;
  height: 600px;
  margin-bottom: 24px;
  overflow: hidden;
}

.upload-area {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-trigger {
  text-align: center;
  cursor: pointer;
  padding: 32px;
}

.upload-trigger .anticon {
  font-size: 48px;
  color: #00416a;
  margin-bottom: 16px;
}

.upload-hint {
  color: #999;
  font-size: 14px;
  margin-top: 8px;
}

.preview-area {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.preview-content {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.control-panel {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 24px;
}

.result-panel {
  background: #f8f8f8;
  padding: 16px;
  border-radius: 8px;
}

.result-panel h3 {
  margin-bottom: 16px;
  color: #00416a;
}

.result-content {
  color: #666;
}

.preview-area img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

/* 添加加载状态样式 */
:deep(.ant-spin-container) {
  height: 100%;
}

:deep(.ant-spin) {
  max-height: none;
}

:deep(.ant-spin-spinning) {
  background: rgba(255, 255, 255, 0.8);
}

/* Add styles for the error banner */
.error-banner {
  margin-bottom: 16px;
}
</style>
