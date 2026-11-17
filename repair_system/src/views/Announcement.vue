<template>
  <div class="announcement-page">
    <div class="announcement-list">
      <div
        v-for="item in sortedList"
        :key="item.id"
        class="announcement-item"
        :class="{ 'is-top': isTop(item) }"
        @click="openDetail(item.id)"
      >
        <div class="announcement-title">
          <span v-if="isTop(item)" class="top-badge">置顶</span>
          <span class="title-text">{{ item.title }}</span>
        </div>
        <div class="announcement-time">{{ item.create_at }}</div>
      </div>

      <div v-if="!sortedList.length" class="empty">暂无公告</div>
    </div>

    <div v-if="isRoot" class="add-btn" @click.stop="openDialog">+</div>

    <div v-if="detailVisible" class="modal-mask" @click.self="closeDetail">
      <div class="modal">
        <div class="modal-header">
          <h3>公告详情</h3>
          <button class="close-btn" @click="closeDetail">×</button>
        </div>

        <div class="modal-body">
          <div v-if="detailLoading" class="loading">加载中...</div>
          <div v-else-if="detailError" class="loading">{{ detailError }}</div>
          <div v-else class="detail-page">
            <h1 class="detail-title">
              <span v-if="isTop(detail)" class="top-tag">置顶</span>
              {{ detail.title }}
            </h1>

            <div class="meta">
              <span>发布时间：{{ formatTime(detail.create_at) }}</span>
              <span>发布对象：{{ targetText(detail.target) }}</span>
            </div>

            <div class="content">{{ detail.content }}</div>

            <div v-if="isRoot" class="actions">
              <button v-if="!isTop(detail)" class="btn primary" @click="handleTop">
                置顶
              </button>
              <button v-else class="btn" @click="handleUntop">
                取消置顶
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="dialogVisible" class="modal-mask" @click.self="closeDialog">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3>发布公告</h3>
          <button class="close-btn" @click="closeDialog">×</button>
        </div>

        <div class="modal-body">
          <div class="form-item">
            <label>标题</label>
            <input v-model="form.title" type="text" placeholder="请输入公告标题" />
          </div>

          <div class="form-item">
            <label>内容</label>
            <textarea v-model="form.content" placeholder="请输入公告内容"></textarea>
          </div>

          <div class="form-item">
            <label>对谁开放</label>
            <select v-model="form.target">
              <option value="all">全部</option>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          
          <div class="form-actions">
            <button class="btn-cancel" @click="closeDialog">取消</button>
            <button class="btn-confirm" @click="submitAnnouncement">发布</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import { useCounterStore } from '../stores/counter'

const userStore = useCounterStore()
const isRoot = computed(() => userStore.role === 'root')

const list = ref([])

function isTop(item) {
  if (!item) return false
  return item.is_top === true || item.is_top === 1 || item.is_top === 'true'
}

const sortedList = computed(() => {
  return [...list.value].sort((a, b) => {
    const ta = isTop(a) ? 1 : 0
    const tb = isTop(b) ? 1 : 0
    if (tb !== ta) return tb - ta
    return new Date(b.create_at) - new Date(a.create_at)
  })
})

async function List() {
  try {
    const res = await axios.post('http://localhost:3000/getannouncement', {
      token: localStorage.getItem('token')
    })
    if (res.data.status === 200) {
      list.value = res.data.data || []
    }
  } catch (err) {
    console.error('获取公告列表错误:', err)
  }
}

const detailVisible = ref(false)
const detailLoading = ref(false)
const detailError = ref('')
const detail = ref({})

function openDetail(id) {
  detailVisible.value = true
  detailLoading.value = true
  detailError.value = ''
  detail.value = {}
  document.body.style.overflow = 'hidden'
  getDetail(id)
}

function closeDetail() {
  detailVisible.value = false
  document.body.style.overflow = ''
}

async function getDetail(id) {
  try {
    const res = await axios.post('http://localhost:3000/idannouncement', {
      token: localStorage.getItem('token'),
      id
    })
    if (res.data.status === 200) {
      detail.value = res.data.data || {}
    } else {
      detailError.value = res.data.error || '获取公告失败'
    }
  } catch (e) {
    detailError.value = '网络错误'
  } finally {
    detailLoading.value = false
  }
}

function formatTime(str) {
  if (!str) return ''
  const d = new Date(str)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function targetText(t) {
  return { all: '全部', user: '用户', admin: '管理员' }[t] || '全部'
}

async function handleTop() {
  try {
    const res = await axios.post('http://localhost:3000/topannouncement', {
      token: localStorage.getItem('token'),
      id: detail.value.id
    })
    if (res.data.status === 200) {
      detail.value.is_top = 1
      List()
    } else {
      alert(res.data.error || '操作失败')
    }
  } catch (e) {
    console.error(e)
    alert('网络错误')
  }
}

async function handleUntop() {
  try {
    const res = await axios.post('http://localhost:3000/untopannouncement', {
      token: localStorage.getItem('token'),
      id: detail.value.id
    })
    if (res.data.status === 200) {
      detail.value.is_top = 0
      List()
    } else {
      alert(res.data.error || '操作失败')
    }
  } catch (e) {
    console.error(e)
    alert('网络错误')
  }
}

const dialogVisible = ref(false)
const form = ref({ title: '', content: '', target: 'all' })

function openDialog() {
  form.value = { title: '', content: '', target: 'all' }
  dialogVisible.value = true
  document.body.style.overflow = 'hidden'
}

function closeDialog() {
  dialogVisible.value = false
  document.body.style.overflow = ''
}

async function submitAnnouncement() {
  if (!form.value.title || !form.value.content) {
    alert('请填写标题和内容')
    return
  }
  try {
    const res = await axios.post('http://localhost:3000/addannouncement', {
      token: localStorage.getItem('token'),
      title: form.value.title,
      content: form.value.content,
      target: form.value.target
    })
    if (res.data.status === 200) {
      alert('发布成功')
      closeDialog()
      List()
    } else {
      alert(res.data.error || '发布失败')
    }
  } catch (err) {
    console.error(err)
  }
}

onMounted(() => {
  List()
})
</script>

<style scoped>
.announcement-page {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 16px;
  box-sizing: border-box;
}

.announcement-list {
  margin-top: 5vh;
}

.announcement-item {
  background-color: #ffffff;
  border-radius: 12px;
  padding: 16px 18px;
  margin-bottom: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.announcement-item:hover {
  background-color: #fafafa;
}

.announcement-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #000000;
  margin-bottom: 6px;
}

.title-text {
  flex: 1;
  word-break: break-word;
}

.top-badge {
  flex: 0 0 auto;
  font-size: 11px;
  font-weight: 500;
  color: #ffffff;
  background: #ef4444;
  border-radius: 4px;
  padding: 1px 6px;
}

.announcement-time {
  font-size: 13px;
  color: #888888;
}

.empty {
  padding: 60px 0;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}

.add-btn {
  position: fixed;
  left: 90vw;
  bottom: 75px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #2563eb;
  color: #fff;
  font-size: 30px;
  line-height: 50px;
  text-align: center;
  box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);
  user-select: none;
  z-index: 100;
}

.add-btn:hover {
  background: #1d4ed8;
  transform: scale(1.05);
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

.modal.modal-sm {
  width: 440px;
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

.detail-title {
  font-size: 20px;
  font-weight: 600;
  color: #222;
  margin: 0 0 12px;
  line-height: 1.5;
  word-break: break-word;
}

.top-tag {
  display: inline-block;
  font-size: 12px;
  font-weight: 400;
  color: #fff;
  background: #e6772e;
  border-radius: 4px;
  padding: 2px 6px;
  margin-right: 6px;
  vertical-align: middle;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #999;
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.content {
  margin-top: 18px;
  font-size: 15px;
  line-height: 1.9;
  color: #333;
  white-space: pre-wrap;
  word-break: break-word;
}

.actions {
  margin-top: 26px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
  text-align: right;
}

.btn {
  min-width: 92px;
  padding: 8px 16px;
  font-size: 14px;
  color: #555;
  background: #fff;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
}

.btn:hover {
  border-color: #b5b5b5;
}

.btn.primary {
  color: #fff;
  background: #409eff;
  border-color: #409eff;
}

.btn.primary:hover {
  background: #66b1ff;
  border-color: #66b1ff;
}

.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.form-item label {
  font-size: 13px;
  color: #6b7280;
}

.form-item input,
.form-item textarea,
.form-item select {
  width: 100%;
  padding: 6px 8px;
  font-size: 14px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  box-sizing: border-box;
  outline: none;
  background: #fff;
}

.form-item input:focus,
.form-item textarea:focus,
.form-item select:focus {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.form-item textarea {
  min-height: 90px;
  resize: vertical;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.btn-cancel {
  padding: 8px 20px;
  font-size: 14px;
  background: #fff;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.btn-cancel:hover {
  background: #f3f4f6;
}

.btn-confirm {
  padding: 8px 24px;
  font-size: 14px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 4px;
}

.btn-confirm:hover {
  background: #1d4ed8;
}
</style>