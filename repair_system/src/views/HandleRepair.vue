<template>
  <div class="repair-list">
    <div
      v-for="item in repairList"
      :key="item.id"
      class="repair-item"
      @click="openDetail(item.id)"
    >
      <div class="repair-title">{{ item.r_title }}</div>
      <div class="repair-time">{{ item.r_date }}</div>
      <div class="repair-id">单号：{{ item.id }}</div>
    </div>

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
                      <img
                        v-for="(img, i) in rImages"
                        :key="i"
                        :src="'http://localhost:3000/uploads/' + img"
                        alt="报修图片"
                      />
                    </div>
                  </div>
                </div>
              </section>
              <section class="section">
                <h3 class="section-title">处理信息</h3>
                <div class="section-content">
                  <div v-if="detail.status === 0" class="repair-form">
                    <div class="form-item">
                      <label>维修人</label>
                      <input v-model="repairForm.f_name" type="text" :placeholder="name" />
                    </div>
                    <div class="form-item">
                      <label>联系方式</label>
                      <input v-model="repairForm.f_contact" type="text" :placeholder="contact" />
                    </div>
                    <div class="form-item">
                      <label>修复标题</label>
                      <input v-model="repairForm.f_title" type="text" placeholder="请输入修复标题" />
                    </div>
                    <div class="form-item">
                      <label>修复内容</label>
                      <textarea v-model="repairForm.f_content" placeholder="请填写修复内容"></textarea>
                    </div>
                    <div class="form-item">
                      <label>修复图片</label>
                      <input
                        ref="fileInputRef"
                        class="file-input"
                        type="file"
                        multiple
                        accept="image/*"
                        @change="onFileChange"
                      />
                      <div v-if="files.length" class="image-list">
                        <img v-for="(file, i) in files" :key="i" :src="file.src" alt="预览图" />
                      </div>
                    </div>
                    <div class="form-actions">
                      <button class="btn-submit" :disabled="loading" @click="submitRepair">
                        {{ loading ? "提交中..." : "提交修复" }}
                      </button>
                    </div>
                  </div>
                  <div v-else class="info-grid">
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

                  <div v-if="detail.status !== 0 && fImages.length" class="image-block">
                    <p class="image-label">修复图片</p>
                    <div class="image-list">
                      <img
                        v-for="(img, i) in fImages"
                        :key="i"
                        :src="'http://localhost:3000/uploads/' + img"
                        alt="修复图片"
                      />
                    </div>
                  </div>
                </div>
              </section>
              <section v-if="detail.status === 2" class="section">
                <h3 class="section-title">用户评价</h3>
                <div class="section-content">
                  <div class="info-grid">
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
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useCounterStore } from '@/stores/counter'

const counterStore = useCounterStore()
const name = counterStore.name
const contact = counterStore.phone || counterStore.email


const repairList = ref([])

function RepairData() {
  axios
    .post('http://localhost:3000/getrepair', {
      token: localStorage.getItem('token')
    })
    .then((res) => {
      console.log(res)
      repairList.value = res.data.data
      console.log('报修列表:', repairList.value)
    })
    .catch((err) => {
      console.error('获取报修列表错误:', err)
    })
}


const dialogVisible = ref(false)
const currentId = ref(null)
const detail = ref(null)
const loading = ref(false)
const fileInputRef = ref(null)
const files = ref([])

const repairForm = ref({
  f_name: '',
  f_contact: '',
  f_title: '',
  f_content: ''
})

const rImages = computed(() => toArray(detail.value && detail.value.r_images))
const fImages = computed(() => toArray(detail.value && detail.value.f_images))

const statusText = computed(() => {
  if (!detail.value) return ''
  if (detail.value.status === 1) return '已修复'
  if (detail.value.status === 2) return '已评价'
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
  loading.value = false
  repairForm.value = { f_name: '', f_contact: '', f_title: '', f_content: '' }
  clearFiles()
  dialogVisible.value = true
  getrepair()
}

function closeDialog() {
  dialogVisible.value = false
  clearFiles()
}


async function getrepair() {
  try {
    const res = await axios.post('http://localhost:3000/idgetrepair', {
      id: currentId.value
    })
    detail.value = res.data.data[0]
  } catch (err) {
    console.error('获取报修详情错误:', err)
  }
}


function clearFiles() {
  files.value.forEach((item) => URL.revokeObjectURL(item.src))
  files.value = []
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

function onFileChange(e) {
  const selectedFiles = Array.from(e.target.files)
  files.value.forEach((item) => URL.revokeObjectURL(item.src))
  files.value = []

  for (const file of selectedFiles) {
    files.value.push({
      file: file,
      src: URL.createObjectURL(file)
    })
  }
}


function submitRepair() {
  const formData = new FormData()
  formData.append('id', detail.value.id)
  formData.append('f_id', counterStore.id)
  formData.append('f_name', repairForm.value.f_name || name)
  formData.append('f_contact', repairForm.value.f_contact || contact)
  formData.append('f_title', repairForm.value.f_title)
  formData.append('f_content', repairForm.value.f_content)

  for (let i = 0; i < files.value.length; i++) {
    const file = files.value[i].file
    if (file && file.type.startsWith('image/')) {
      formData.append('img', file)
    }
  }

  loading.value = true
  axios
    .post('http://localhost:3000/handlerepair', formData)
    .then(() => {
      repairForm.value = { f_name: '', f_contact: '', f_title: '', f_content: '' }
      clearFiles()
      alert('提交成功')
      getrepair()
      RepairData()
    })
    .catch((err) => {
      console.error('提交修复错误:', err)
    })
    .finally(() => {
      loading.value = false
    })
}

onMounted(() => {
  RepairData()
})
</script>

<style scoped>
.repair-list {
  margin-top: 5vh;
  padding: 16px;
  background-color: #f5f7fa;
  min-height: 100vh;
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
  margin-bottom: 4px;
}

.repair-id {
  font-size: 12px;
  color: #888888;
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

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item label {
  font-size: 13px;
  color: #6b7280;
}

.form-item input,
.form-item textarea {
  width: 100%;
  padding: 6px 8px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-sizing: border-box;
  outline: none;
}

.form-item input:focus,
.form-item textarea:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-item textarea {
  min-height: 80px;
  resize: vertical;
}

.file-input {
  padding: 4px 0;
  font-size: 14px;
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
  border-radius: 4px;
}

.loading {
  padding: 60px 0;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}
</style>