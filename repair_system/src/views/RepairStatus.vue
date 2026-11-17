<template>
  <div class="repair-list">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <input v-model="searchKeyword" type="search" placeholder="搜索报修标题或内容" />
      <button v-if="searchKeyword" class="search-clear" @click="searchKeyword = ''">
        清空
      </button>
    </div>

    <!-- 报修列表 -->
    <div v-for="item in filteredRepairList" :key="item.id" class="repair-item" @click="openDetail(item.id)">
      <div class="repair-title">{{ item.r_title }}</div>
      <div class="repair-time">{{ item.r_date }}</div>
      <div class="repair-meta">
        <span>单号：{{ item.id }}</span>
        <span v-if="item.area">区域：{{ item.area }}</span>
        <span v-if="item.category">分类：{{ item.category }}</span>
      </div>
    </div>

    <div v-if="!filteredRepairList.length" class="empty">
      {{ searchKeyword ? "没有匹配的报修记录" : "暂无报修记录" }}
    </div>

    <!-- 详情弹窗 -->
    <div v-if="dialogVisible" class="modal-mask" @click.self="closeDialog">
      <div class="modal">
        <div class="modal-header">
          <h3>报修详情</h3>
          <button class="close-btn" @click="closeDialog">×</button>
        </div>

        <div class="modal-body">
          <div v-if="detail" class="detail-page">
            <div class="status-bar">
              <span class="status-text">{{ statusText }}</span>
            </div>

            <div class="sections">
              <!-- 报修信息 -->
              <section class="section">
                <h3 class="section-title">报修信息</h3>
                <div class="section-content">
                  <div class="info-grid">
                    <div class="info-row">
                      <span class="info-label">报修人</span>
                      <span class="info-value">{{ detail.u_name }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">联系方式</span>
                      <span class="info-value">{{ detail.u_contact }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">报修时间</span>
                      <span class="info-value">{{ detail.r_date }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">当前状态</span>
                      <span class="info-value">{{ statusText }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">区域</span>
                      <span class="info-value">{{ detail.area }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">分类</span>
                      <span class="info-value">{{ detail.category }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">标题</span>
                      <span class="info-value">{{ detail.r_title }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">内容</span>
                      <span class="info-value pre">{{ detail.r_content }}</span>
                    </div>
                  </div>

                  <div v-if="rImages.length" class="image-block">
                    <p class="image-label">报修图片</p>
                    <div class="image-list">
                      <img v-for="(img, i) in rImages" :key="i" :src="`http://localhost:3000/uploads/${img}`" alt="报修图片" />
                    </div>
                  </div>

                  <!-- 用户：待处理时可撤回 -->
                  <div v-if="detail.status === 0 && !isAdmin" class="form-actions">
                    <button class="btn-danger" @click="cancelRepair">
                      撤回报修
                    </button>
                  </div>
                </div>
              </section>

              <!-- 管理员：待处理时填写处理信息 -->
              <section v-if="detail.status === 0 && isAdmin" class="section">
                <h3 class="section-title">处理信息</h3>
                <div class="section-content">
                  <div class="repair-form">
                    <div class="form-grid">
                      <div class="form-item">
                        <label>维修人</label>
                        <input v-model="repairForm.f_name" type="text" :placeholder="defaultName || '请输入维修人'" />
                      </div>
                      <div class="form-item">
                        <label>联系方式</label>
                        <input v-model="repairForm.f_contact" type="text" :placeholder="defaultContact || '请输入联系方式'" />
                      </div>
                      <div class="form-item full">
                        <label>修复标题</label>
                        <input v-model="repairForm.f_title" type="text" placeholder="请输入修复标题" />
                      </div>
                      <div class="form-item full">
                        <label>修复内容</label>
                        <textarea v-model="repairForm.f_content" placeholder="请填写修复内容"></textarea>
                      </div>
                      <div class="form-item full">
                        <label>修复图片</label>
                        <input ref="fileInputRef" class="file-input" type="file" multiple accept="image/*"
                          @change="onFileChange" />
                        <div v-if="files.length" class="image-list">
                          <img v-for="(file, i) in files" :key="i" :src="file.src" alt="预览图" />
                        </div>
                      </div>
                    </div>

                    <div class="form-actions">
                      <button class="btn-submit" :disabled="loading" @click="submitRepair">
                        {{ loading ? "提交中..." : "提交修复" }}
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              <!-- 已修复/已评价：修复信息 -->
              <section v-if="detail.status >= 1" class="section">
                <h3 class="section-title">修复信息</h3>
                <div class="section-content">
                  <div class="info-grid">
                    <div class="info-row">
                      <span class="info-label">维修人</span>
                      <span class="info-value">{{ detail.f_name }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">联系方式</span>
                      <span class="info-value">{{ detail.f_contact }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">修复时间</span>
                      <span class="info-value">{{ detail.reply_date }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">修复标题</span>
                      <span class="info-value">{{ detail.f_title }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">修复内容</span>
                      <span class="info-value pre">{{ detail.f_content }}</span>
                    </div>
                  </div>

                  <div v-if="fImages.length" class="image-block">
                    <p class="image-label">修复图片</p>
                    <div class="image-list">
                      <img v-for="(img, i) in fImages" :key="i" :src="`http://localhost:3000/uploads/${img}`" alt="修复图片" />
                    </div>
                  </div>
                </div>
              </section>

              <!-- 评价：用户已修复后可评价；管理员仅已评价后查看 -->
              <section v-if="detail.status >= 1 && (detail.status === 2 || !isAdmin)" class="section">
                <h3 class="section-title">用户评价</h3>
                <div class="section-content">
                  <div v-if="detail.status === 1 && !isAdmin && !submitted" class="repair-form">
                    <div class="form-grid">
                      <div class="form-item">
                        <label>评价标题</label>
                        <input v-model="reviewForm.title" type="text" placeholder="请填写评价标题" />
                      </div>
                      <div class="form-item">
                        <label>评分</label>
                        <div class="score-row">
                          <button v-for="n in 5" :key="n" type="button" class="score-btn"
                            :class="{ 'is-active': reviewForm.score === n }" @click="reviewForm.score = n">
                            {{ n }}
                          </button>
                          <span class="score-text">{{ reviewForm.score }} 分</span>
                        </div>
                      </div>
                      <div class="form-item full">
                        <label>评价内容</label>
                        <textarea v-model="reviewForm.content" placeholder="请填写评价内容"></textarea>
                      </div>
                    </div>

                    <div class="form-actions">
                      <button class="btn-submit" :disabled="reviewLoading" @click="submitReview">
                        {{ reviewLoading ? "提交中..." : "提交评价" }}
                      </button>
                    </div>
                  </div>

                  <div v-else class="info-grid">
                    <div class="info-row">
                      <span class="info-label">评价标题</span>
                      <span class="info-value">{{ detail.review_title }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">评价内容</span>
                      <span class="info-value pre">{{ detail.review_content }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">评分</span>
                      <span class="info-value">{{ detail.review_score }} 分</span>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div v-else class="loading">加载中...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import axios from "axios";
import { useCounterStore } from "@/stores/counter";

const store = useCounterStore();

const repairList = ref([]);
const searchKeyword = ref("");

const dialogVisible = ref(false);
const currentId = ref(null);
const detail = ref(null);
const loading = ref(false);
const reviewLoading = ref(false);
const submitted = ref(false);
const fileInputRef = ref(null);
const files = ref([]);

const repairForm = ref({
  f_name: "",
  f_contact: "",
  f_title: "",
  f_content: "",
});

const reviewForm = ref({
  title: "",
  content: "",
  score: 5,
});

// 请按你实际 store 中的管理员标识调整
const isAdmin = computed(() => {
  return (
    store.isAdmin === true ||
    store.role === "admin" ||
    store.role === "管理员" ||
    store.role === 1 ||
    store.role === "1"
  );
});

const defaultName = computed(() => store.name || "");
const defaultContact = computed(() => store.phone || store.email || "");

const rImages = computed(() => toArray(detail.value && detail.value.r_images));
const fImages = computed(() => toArray(detail.value && detail.value.f_images));

const statusText = computed(() => {
  if (!detail.value) return "";
  if (detail.value.status === 1) return "已修复";
  if (detail.value.status === 2) return "已评价";
  return "待处理";
});

const filteredRepairList = computed(() => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) return repairList.value;

  return repairList.value.filter((item) => {
    const title = String(item.r_title || "").toLowerCase();
    const content = String(item.r_content || "").toLowerCase();
    return title.includes(keyword) || content.includes(keyword);
  });
});

function toArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try {
    return JSON.parse(val);
  } catch (e) {
    return [];
  }
}

function loadRepairList() {
  const url = isAdmin.value
    ? 'http://localhost:3000/getrepair'
    : 'http://localhost:3000/usergetrepair';

  const payload = isAdmin.value
    ? { token: localStorage.getItem("token") }
    : { id: store.id };

  axios
    .post(url, payload)
    .then((res) => {
      if (res.data.status && res.data.status !== 200) {
        console.log(res.data.error);
        return;
      }
      repairList.value = res.data.data || [];
    })
    .catch((err) => {
      console.error("获取报修列表错误:", err);
    });
}

function openDetail(id) {
  currentId.value = id;
  detail.value = null;
  submitted.value = false;
  loading.value = false;
  reviewLoading.value = false;
  repairForm.value = {
    f_name: "",
    f_contact: "",
    f_title: "",
    f_content: "",
  };
  reviewForm.value = {
    title: "",
    content: "",
    score: 5,
  };
  clearFiles();
  dialogVisible.value = true;
  getrepair();
}

function closeDialog() {
  dialogVisible.value = false;
  clearFiles();
}

async function getrepair() {
  const res = await axios.post('http://localhost:3000/idgetrepair', {
    id: currentId.value,
  });
  detail.value = res.data.data[0] || null;
}

async function cancelRepair() {
  try {
    await axios.post('http://localhost:3000/iddeleterepair', {
      id: currentId.value,
    });
    alert("已撤回报修");
    closeDialog();
    loadRepairList();
  } catch (err) {
    console.error("撤回报修错误:", err);
  }
}

function clearFiles() {
  files.value.forEach((item) => URL.revokeObjectURL(item.src));
  files.value = [];
  if (fileInputRef.value) {
    fileInputRef.value.value = "";
  }
}

function onFileChange(e) {
  const selectedFiles = Array.from(e.target.files);
  files.value.forEach((item) => URL.revokeObjectURL(item.src));
  files.value = [];

  for (const file of selectedFiles) {
    files.value.push({
      file,
      src: URL.createObjectURL(file),
    });
  }
}

function submitRepair() {
  const formData = new FormData();
  formData.append("id", detail.value.id);
  formData.append("f_id", store.id);
  formData.append("f_name", repairForm.value.f_name || defaultName.value);
  formData.append(
    "f_contact",
    repairForm.value.f_contact || defaultContact.value,
  );
  formData.append("f_title", repairForm.value.f_title);
  formData.append("f_content", repairForm.value.f_content);

  for (let i = 0; i < files.value.length; i++) {
    const file = files.value[i].file;
    if (file && file.type.startsWith("image/")) {
      formData.append("img", file);
    }
  }

  loading.value = true;
  axios
    .post('http://localhost:3000/handlerepair', formData)
    .then(() => {
      repairForm.value = {
        f_name: "",
        f_contact: "",
        f_title: "",
        f_content: "",
      };
      clearFiles();
      alert("提交成功");
      getrepair();
      loadRepairList();
    })
    .catch((err) => {
      console.error("提交修复错误:", err);
    })
    .finally(() => {
      loading.value = false;
    });
}

async function submitReview() {
  if (!reviewForm.value.title.trim()) {
    alert("请填写评价标题");
    return;
  }
  if (!reviewForm.value.content.trim()) {
    alert("请填写评价内容");
    return;
  }

  reviewLoading.value = true;
  try {
    console.log("提交评价数据:", {
      id: currentId.value,
      title: reviewForm.value.title,
      content: reviewForm.value.content,
      score: reviewForm.value.score,
    });
    await axios.post('http://localhost:3000/userreview', {
      id: currentId.value,
      title: reviewForm.value.title,
      content: reviewForm.value.content,
      score: reviewForm.value.score,
    });
    submitted.value = true;
    alert("评价成功");
    getrepair();
    loadRepairList();
  } catch (err) {
    console.error("提交评价错误:", err);
  } finally {
    reviewLoading.value = false;
  }
}

onMounted(() => {
  loadRepairList();
  console.log(fImages.value);
});
</script>

<style scoped>
.repair-list {
  margin-top: 5vh;
  padding: 16px;
  background-color: #f5f7fa;
  min-height: 100vh;
  box-sizing: border-box;
}

.search-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding: 10px 12px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.search-bar input {
  flex: 1;
  width: 100%;
  height: 36px;
  padding: 0 12px;
  font-size: 14px;
  color: #111827;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  box-sizing: border-box;
}

.search-bar input:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.search-clear {
  flex: 0 0 auto;
  height: 36px;
  padding: 0 14px;
  font-size: 13px;
  color: #4b5563;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.search-clear:hover {
  background: #e5e7eb;
}

.repair-item {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.repair-item:hover {
  background-color: #fafafa;
  transform: translateY(-1px);
}

.repair-title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 6px;
}

.repair-time {
  font-size: 13px;
  color: #888888;
  margin-bottom: 6px;
}

.repair-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: #888888;
}

.empty {
  padding: 60px 0;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  width: 760px;
  max-width: 92vw;
  max-height: 85vh;
  background: #fff;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.modal-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 17px;
  color: #222;
}

.close-btn {
  padding: 0 4px;
  border: none;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #999;
}

.close-btn:hover {
  color: #333;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px 24px;
  box-sizing: border-box;
}

.detail-page {
  color: #1f2937;
  line-height: 1.5;
  box-sizing: border-box;
}

.status-bar {
  margin-bottom: 16px;
}

.status-text {
  display: inline-block;
  padding: 2px 12px;
  font-size: 13px;
  background: #e5e7eb;
  border-radius: 999px;
  color: #374151;
}

.sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  overflow: hidden;
}

.section-title {
  margin: 0;
  padding: 12px 16px;
  font-size: 15px;
  font-weight: 600;
  background: #f3f4f6;
  border-bottom: 1px solid #d1d5db;
  color: #111827;
}

.section-content {
  padding: 16px;
}

.info-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-row {
  display: flex;
  gap: 8px;
}

.info-label {
  flex: 0 0 80px;
  font-size: 13px;
  color: #6b7280;
}

.info-value {
  flex: 1;
  font-size: 14px;
  word-break: break-word;
}

.info-value.pre {
  white-space: pre-wrap;
}

.image-block {
  margin-top: 14px;
}

.image-label {
  margin: 0 0 8px;
  font-size: 12px;
  color: #9ca3af;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.image-list img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  transition: all 0.15s ease;
}

.image-list img:hover {
  transform: scale(1.03);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.repair-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.form-item.full {
  grid-column: 1 / -1;
}

.form-item label {
  font-size: 13px;
  color: #6b7280;
}

.form-item input,
.form-item textarea {
  width: 100%;
  padding: 9px 10px;
  font-size: 14px;
  color: #111827;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  box-sizing: border-box;
  outline: none;
}

.form-item input:focus,
.form-item textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-item textarea {
  min-height: 96px;
  resize: vertical;
  line-height: 1.6;
}

.file-input {
  padding: 6px 0 !important;
  border: none !important;
  box-shadow: none !important;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.btn-submit {
  padding: 8px 24px;
  font-size: 14px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 6px;
}

.btn-danger {
  padding: 8px 24px;
  font-size: 14px;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 6px;
}

.btn-danger:hover {
  background: #fee2e2;
}

.score-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  flex-wrap: wrap;
}

.score-btn {
  width: 34px;
  height: 34px;
  padding: 0;
  font-size: 13px;
  color: #6b7280;
  background: #fff;
  border: 1px solid #d1d5db;
  border-radius: 50%;
}

.score-btn:hover {
  color: #f59e0b;
  border-color: #f59e0b;
}

.score-btn.is-active {
  color: #fff;
  background: #f59e0b;
  border-color: #f59e0b;
}

.score-text {
  margin-left: 4px;
  font-size: 13px;
  color: #6b7280;
}

.loading {
  padding: 60px 0;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

@media (max-width: 640px) {
  .form-grid {
    grid-template-columns: 1fr;
  }

  .modal-body {
    padding: 14px 16px 20px;
  }

  .modal-header {
    padding: 14px 16px;
  }

  .info-row {
    flex-direction: column;
    gap: 2px;
  }

  .info-label {
    flex: none;
  }
}
</style>
