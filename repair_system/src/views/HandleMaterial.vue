<template>
  <div class="material-list">
    <div
      v-for="item in materialList"
      :key="item.id"
      class="material-item"
      @click="openDetail(item.id)"
    >
      <div class="material-title">{{ item.material }}</div>
      <div class="material-time">{{ item.created_at }}</div>
      <div class="material-id">单号：{{ item.id }}</div>
    </div>

    <div v-if="!materialList.length" class="empty">暂无材料申请</div>

    <div v-if="detailVisible" class="modal-mask" @click.self="closeDetail">
      <div class="modal">
        <div class="modal-header">
          <h3>材料申请详情</h3>
          <button class="close-btn" @click="closeDetail">×</button>
        </div>

        <div class="modal-body">
          <div v-if="detailLoading" class="loading">加载中...</div>
          <div v-else-if="!detail" class="loading">暂无数据</div>
          <div v-else class="detail-page">
            <div class="status-bar">
              <span class="status-text">{{ statusText }}</span>
            </div>

            <div class="sections">
              <section class="section">
                <h3 class="section-title">材料申请信息</h3>
                <div class="section-content">
                  <div class="info-grid">
                    <div class="info-row">
                      <span class="info-label">申请编号</span>
                      <span class="info-value">{{ detail.id }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">申请人</span>
                      <span class="info-value">{{ detail.a_name }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">申请材料</span>
                      <span class="info-value">{{ detail.material }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">申请原因</span>
                      <span class="info-value pre">{{ detail.reason }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">当前状态</span>
                      <span class="info-value">{{ statusText }}</span>
                    </div>
                  </div>

                  <div v-if="images.length" class="image-block">
                    <p class="image-label">申请图片</p>
                    <div class="image-list">
                      <img
                        v-for="(img, i) in images"
                        :key="i"
                        :src="'http://localhost:3000/uploads/' + img"
                        alt="申请图片"
                      />
                    </div>
                  </div>

                  <div v-if="detail.status === 0" class="form-actions">
                    <button class="btn-danger" @click="rejectApply">驳回</button>
                    <button class="btn-submit" @click="agreeApply">同意</button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'

const materialList = ref([])

function materialData() {
  axios
    .post('http://localhost:3000/getmaterial', {
      token: localStorage.getItem('token')
    })
    .then((res) => {
      if (res.data.status === 200) {
        materialList.value = res.data.data || []
      }
    })
    .catch((err) => {
      console.error('获取材料列表错误:', err)
    })
}

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref(null)
const currentId = ref(null)

const images = computed(() => toArray(detail.value && detail.value.images))

const statusText = computed(() => {
  if (!detail.value) return ''
  if (detail.value.status === 1) return '已同意'
  if (detail.value.status === 2) return '已驳回'
  return '待处理'
})

function toArray(val) {
  if (!val) return []
  if (Array.isArray(val)) return val
  try {
    return JSON.parse(val)
  } catch (e) {
    return []
  }
}

function openDetail(id) {
  currentId.value = id
  detail.value = null
  detailLoading.value = true
  detailVisible.value = true
  document.body.style.overflow = 'hidden'
  getApply()
}

function closeDetail() {
  detailVisible.value = false
  document.body.style.overflow = ''
}

async function getApply() {
  detailLoading.value = true
  try {
    const res = await axios.post('http://localhost:3000/idmaterialapply', {
      id: currentId.value
    })
    detail.value = res.data.data[0]
  } catch (err) {
    console.error('获取材料申请详情错误:', err)
  } finally {
    detailLoading.value = false
  }
}

async function agreeApply() {
  try {
    await axios.post('http://localhost:3000/agreematerial', {
      id: currentId.value
    })
    alert('已同意该申请')
    getApply()
    materialData()
  } catch (err) {
    console.error(err)
  }
}

async function rejectApply() {
  try {
    await axios.post('http://localhost:3000/rejectmaterial', {
      id: currentId.value
    })
    alert('已驳回该申请')
    getApply()
    materialData()
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  materialData()
})
</script>

<style scoped>
.material-list {
  margin-top: 5vh;
  padding: 16px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.material-item {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.material-item:hover {
  background-color: #fafafa;
}

.material-title {
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 6px;
}

.material-time {
  font-size: 13px;
  color: #888888;
  margin-bottom: 4px;
}

.material-id {
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
  padding: 16px;
  box-sizing: border-box;
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

.loading {
  padding: 60px 0;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
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
}

.image-list img:hover {
  transform: scale(1.03);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
  border-radius: 4px;
}

.btn-submit:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-submit:disabled {
  opacity: 0.6;
}

.btn-danger {
  padding: 8px 24px;
  font-size: 14px;
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
  border-radius: 4px;
}

.btn-danger:hover {
  background: #fee2e2;
}
</style>