<template>
  <div class="upload-history-page">
    <div class="upload-history-content">
      <div class="upload-history-header">
        <h2>上传历史</h2>
        <p class="description">查看您之前上传的所有文件记录</p>
      </div>

      <div class="upload-history-main">
        <a-table
          :columns="columns"
          :data-source="historyData"
          :loading="loading"
          :pagination="pagination"
          @change="handleTableChange"
          rowKey="id"
        >
          <template #bodyCell="{ column, record }">
            <!-- 文件类型列 -->
            <template v-if="column.key === 'fileType'">
              <a-tag :color="getFileTypeColor(record.fileType)">
                {{ getFileTypeText(record.fileType) }}
              </a-tag>
            </template>

            <!-- 上传时间列 -->
            <template v-if="column.key === 'uploadTime'">
              {{ formatDate(record.uploadTime) }}
            </template>

            <!-- 处理状态列 -->
            <template v-if="column.key === 'status'">
              <a-tag :color="getStatusColor(record.status)">
                {{ getStatusText(record.status) }}
              </a-tag>
            </template>

            <!-- 操作列 -->
            <template v-if="column.key === 'action'">
              <a-space>
                <a-button
                  type="link"
                  @click="viewFile(record)"
                  v-if="record.status === 'success'"
                >
                  查看
                </a-button>
                <a-button
                  type="link"
                  @click="downloadFile(record)"
                  v-if="record.status === 'success' && record.resultUrl"
                >
                  下载
                </a-button>
                <a-button type="link" @click="deleteHistory(record)">
                  删除
                </a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </div>
    </div>

    <!-- 查看文件弹窗 -->
    <a-modal
      v-model:visible="previewModalVisible"
      :title="previewTitle"
      :footer="null"
      width="800px"
      centered
    >
      <div class="preview-container">
        <!-- 视频预览 -->
        <video
          v-if="previewType === 'video'"
          :src="previewUrl"
          controls
          class="preview-content"
        ></video>
        <!-- 图片预览 -->
        <img
          v-else-if="previewType === 'image'"
          :src="previewUrl"
          class="preview-content"
          @error="handleImageError"
        />
        <!-- 其他类型文件 -->
        <div v-else class="unsupported-preview">
          <p>该文件类型不支持预览</p>
          <a-button type="primary" @click="downloadFile(currentRecord)"
            >下载文件</a-button
          >
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { message, Modal } from "ant-design-vue";
import { getUserUploadHistory, deleteUploadHistory } from "@/api/user";
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import type { TablePaginationConfig } from "ant-design-vue";

// 定义上传历史记录的类型
interface UploadHistory {
  id: number;
  userId: number;
  fileName: string;
  fileType: "image" | "video" | "other";
  fileSize: number;
  uploadTime: string;
  status: "success" | "processing" | "failed";
  originalUrl?: string;
  resultUrl?: string;
  errorMessage?: string;
}

// 表格列定义
const columns = [
  {
    title: "文件名称",
    dataIndex: "fileName",
    key: "fileName",
    ellipsis: true,
  },
  {
    title: "文件类型",
    dataIndex: "fileType",
    key: "fileType",
    width: 100,
  },
  {
    title: "文件大小",
    dataIndex: "fileSize",
    key: "fileSize",
    width: 120,
    customRender: ({ text }: { text: number }) => formatFileSize(text),
  },
  {
    title: "上传时间",
    dataIndex: "uploadTime",
    key: "uploadTime",
    width: 170,
    sorter: true,
  },
  {
    title: "处理状态",
    dataIndex: "status",
    key: "status",
    width: 100,
  },
  {
    title: "操作",
    key: "action",
    width: 180,
  },
];

// 响应式状态
const historyData = ref<UploadHistory[]>([]);
const loading = ref(false);
const pagination = reactive<TablePaginationConfig>({
  current: 1,
  pageSize: 10,
  total: 0,
  showTotal: (total) => `共 ${total} 条记录`,
});

// 预览相关
const previewModalVisible = ref(false);
const previewTitle = ref("");
const previewUrl = ref("");
const previewType = ref<"image" | "video" | "other">("other");
const currentRecord = ref<UploadHistory | null>(null);

// 首次加载
onMounted(() => {
  fetchUploadHistory();
});

// 获取上传历史记录
const fetchUploadHistory = async () => {
  loading.value = true;
  try {
    const res = await getUserUploadHistory({
      page: pagination.current,
      pageSize: pagination.pageSize,
    });

    if (res.data.code === 0) {
      historyData.value = res.data.data.records;
      pagination.total = res.data.data.total;
    } else {
      message.error(res.data.message || "获取上传历史失败");
    }
  } catch (error) {
    console.error("获取上传历史出错:", error);
    message.error("获取上传历史失败");
  } finally {
    loading.value = false;
  }
};

// 处理表格变化（分页、排序等）
const handleTableChange = (pag: TablePaginationConfig) => {
  pagination.current = pag.current || 1;
  fetchUploadHistory();
};

// 格式化文件大小
const formatFileSize = (size: number) => {
  if (size < 1024) {
    return size + " B";
  } else if (size < 1024 * 1024) {
    return (size / 1024).toFixed(2) + " KB";
  } else {
    return (size / (1024 * 1024)).toFixed(2) + " MB";
  }
};

// 格式化日期
const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    const timeAgo = formatDistanceToNow(date, {
      addSuffix: true,
      locale: zhCN,
    });
    return timeAgo;
  } catch (e) {
    return dateString;
  }
};

// 获取文件类型显示文本
const getFileTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    image: "图片",
    video: "视频",
    other: "其它",
  };
  return typeMap[type] || "未知";
};

// 获取文件类型颜色
const getFileTypeColor = (type: string) => {
  const colorMap: Record<string, string> = {
    image: "blue",
    video: "purple",
    other: "default",
  };
  return colorMap[type] || "default";
};

// 获取状态显示文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    success: "成功",
    processing: "处理中",
    failed: "失败",
  };
  return statusMap[status] || "未知";
};

// 获取状态颜色
const getStatusColor = (status: string) => {
  const colorMap: Record<string, string> = {
    success: "success",
    processing: "processing",
    failed: "error",
  };
  return colorMap[status] || "default";
};

// 查看文件
const viewFile = (record: UploadHistory) => {
  currentRecord.value = record;
  previewTitle.value = record.fileName;

  // 设置预览类型和URL
  if (record.fileType === "image") {
    previewType.value = "image";
    previewUrl.value = record.resultUrl || record.originalUrl || "";
  } else if (record.fileType === "video") {
    previewType.value = "video";
    previewUrl.value = record.resultUrl || record.originalUrl || "";
  } else {
    previewType.value = "other";
    previewUrl.value = "";
  }

  previewModalVisible.value = true;
};

// 下载文件
const downloadFile = (record: UploadHistory) => {
  if (!record.resultUrl && !record.originalUrl) {
    message.error("没有可下载的文件");
    return;
  }

  const url = record.resultUrl || record.originalUrl || "";
  const link = document.createElement("a");
  link.style.display = "none";
  link.href = url;
  link.download = record.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 删除历史记录
const deleteHistory = (record: UploadHistory) => {
  Modal.confirm({
    title: "确认删除",
    content: "确定要删除此上传记录吗？此操作不可撤销。",
    okText: "确认",
    cancelText: "取消",
    onOk: async () => {
      try {
        const res = await deleteUploadHistory(record.id);
        if (res.data.code === 0) {
          message.success("删除成功");
          // 重新加载数据
          fetchUploadHistory();
        } else {
          message.error(res.data.message || "删除失败");
        }
      } catch (error) {
        console.error("删除记录出错:", error);
        message.error("删除失败");
      }
    },
  });
};

// 处理图片加载错误
const handleImageError = (e: Event) => {
  message.error("图片加载失败");
};
</script>

<style scoped>
.upload-history-page {
  position: relative;
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  min-height: calc(100vh - 180px);
}

.upload-history-header {
  text-align: center;
  margin-bottom: 32px;
}

.upload-history-header h2 {
  font-size: 24px;
  color: #00416a;
  margin-bottom: 8px;
}

.description {
  color: #666;
  font-size: 16px;
}

.upload-history-main {
  max-width: 1200px;
  margin: 0 auto;
}

.preview-container {
  width: 100%;
  max-height: 70vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: auto;
}

.preview-content {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.unsupported-preview {
  text-align: center;
  padding: 40px;
}
</style>
