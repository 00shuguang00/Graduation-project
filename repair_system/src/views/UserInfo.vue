<template>
  <div class="user-info">
    <div class="header">
      <img
        class="avatar"
        :src="avatarUrl"
        alt="头像"
        @click="triggerFileInput"
      />
      <input
        type="file"
        ref="fileInput"
        accept="image/*"
        style="display: none"
        @change="handleFileChange"
      />
      <h1 class="username">{{ userStore.name }}</h1>
    </div>

    <div class="section">
      <h2>账号信息</h2>

      <div class="info-row">
        <span class="label">用户名</span>
        <span class="value">{{ userStore.name || '未设置' }}</span>
        <button class="action-btn" @click="openDialog('name')">修改用户名</button>
      </div>

      <div class="info-row">
        <span class="label">手机号</span>
        <span class="value">{{ userStore.phone || '未绑定' }}</span>
        <button class="action-btn" @click="openDialog('phone')">
          {{ userStore.phone ? '修改手机号' : '新增手机号' }}
        </button>
      </div>

      <div class="info-row">
        <span class="label">邮箱</span>
        <span class="value">{{ userStore.email || '未绑定' }}</span>
        <button class="action-btn" @click="openDialog('email')">
          {{ userStore.email ? '修改邮箱' : '新增邮箱' }}
        </button>
      </div>

      <div class="info-row">
        <span class="label">密码</span>
        <span class="value">••••••</span>
        <button class="action-btn" @click="openDialog('password')">修改密码</button>
      </div>
      <div v-if="isRoot" class="info-row">
        <span class="label">管理用户</span>
        <span class="value"></span>
        <button class="action-btn" @click="openUserDialog">查看用户列表</button>
      </div>
    </div>
    <div class="logout-wrap">
      <button class="logout-btn" @click="handleLogout">退出登录</button>
    </div>

    <div v-if="dialogVisible" class="modal-mask" @click.self="closeDialog">
      <div class="modal">
        <h3>{{ dialogTitle }}</h3>
        <div class="form-item">
          <label>{{ inputLabel }}</label>
          <input
            v-model="form.value"
            :type="inputType"
            :placeholder="inputPlaceholder"
            class="input"
          />
          <div class="error">{{ errors.value }}</div>
        </div>
        <div class="form-item">
          <label>当前密码</label>
          <input
            v-model="form.password"
            type="password"
            placeholder="请输入当前密码"
            class="input"
          />
          <div class="error">{{ errors.password }}</div>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="closeDialog">取消</button>
          <button class="btn primary" :disabled="submitting" @click="submit">
            {{ submitting ? '提交中...' : '确认' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="userDialogVisible" class="modal-mask" @click.self="closeUserDialog">
      <div class="modal user-modal">
        <h3>用户管理</h3>
        <div v-if="userListError" class="error">{{ userListError }}</div>
        <div v-else-if="loadingUsers" class="loading-tip">加载中...</div>
        <div v-else class="user-list">
          <div v-for="u in userList" :key="u.u_id" class="user-item">
            <div class="user-main">
              <span class="u-name">{{ u.u_name }}</span>
              <span class="u-detail">
                {{ u.phone || '未绑定手机号' }} · {{ u.email || '未绑定邮箱' }}
              </span>
              <span class="u-role">角色：{{ u.role }}</span>
            </div>
            <button
              class="btn danger"
              :disabled="Number(u.u_id) === Number(userStore.id)"
              @click="promptDelete(u)"
            >
              删除
            </button>
          </div>
          <div v-if="userList.length === 0" class="loading-tip">暂无用户</div>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="closeUserDialog">关闭</button>
        </div>
      </div>
    </div>

    <div v-if="deleteDialogVisible" class="modal-mask" @click.self="closeDeleteDialog">
      <div class="modal">
        <h3>删除用户</h3>
        <p class="delete-tip">
          确定要删除用户「<b>{{ deleteTarget?.u_name }}</b>」吗？该操作不可恢复。
        </p>
        <div class="form-item">
          <label>管理员密码</label>
          <input
            v-model="deletePassword"
            type="password"
            placeholder="请输入当前管理员密码"
            class="input"
          />
          <div class="error">{{ deleteError }}</div>
        </div>
        <div class="modal-actions">
          <button class="btn" @click="closeDeleteDialog">取消</button>
          <button class="btn danger" :disabled="deleting" @click="confirmDelete">
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { useCounterStore } from '@/stores/counter'

const router = useRouter()
const userStore = useCounterStore()

const REGEX = {
  phone: /^[0-9]{11}$/,
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  password: /^[A-Za-z0-9@_.]{5,11}$/,
}

const isRoot = computed(() => userStore.role === 'root')

const fileInput = ref(null)
const avatarUrl = computed(() => {
  if (userStore.image) {
    return `http://localhost:3000/uploads/${userStore.image}`
  }
  return 'http://localhost:3000/uploads/defaultimg.png'
})

function triggerFileInput() {
  fileInput.value.click()
}

async function handleFileChange(e) {
  const file = e.target.files[0]
  if (!file) return
  const formData = new FormData()
  formData.append('token', localStorage.getItem('token'))
  formData.append('img', file)

  try {
    const res = await axios.post('http://localhost:3000/updateavatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    if (res.data.status === 200) {
      userStore.image = res.data.data.image
      alert('头像更新成功')
    } else {
      alert(res.data.error || '上传失败')
    }
  } catch (err) {
    alert('网络错误，请稍后重试')
  } finally {
    e.target.value = ''
  }
}

function handleLogout() {
  if (!confirm('确定要退出登录吗？')) return
  localStorage.removeItem('token')
  userStore.clearUserInfo()
  router.push('/login')
}

const dialogVisible = ref(false)
const dialogType = ref('')
const form = reactive({ value: '', password: '' })
const errors = reactive({ value: '', password: '' })
const submitting = ref(false)

const dialogTitle = computed(() => {
  if (dialogType.value === 'name') return '修改用户名'
  if (dialogType.value === 'phone') return userStore.phone ? '修改手机号' : '新增手机号'
  if (dialogType.value === 'email') return userStore.email ? '修改邮箱' : '新增邮箱'
  return '修改密码'
})

const inputLabel = computed(() => {
  if (dialogType.value === 'name') return '新用户名'
  if (dialogType.value === 'phone') return '新手机号'
  if (dialogType.value === 'email') return '新邮箱'
  return '新密码'
})

const inputType = computed(() => (dialogType.value === 'password' ? 'password' : 'text'))

const inputPlaceholder = computed(() => {
  if (dialogType.value === 'name') return '请输入2-12位用户名'
  if (dialogType.value === 'phone') return '请输入11位手机号'
  if (dialogType.value === 'email') return '请输入邮箱'
  return '请输入5-11位新密码'
})

function openDialog(type) {
  dialogType.value = type
  form.value = ''
  form.password = ''
  errors.value = ''
  errors.password = ''
  dialogVisible.value = true
}

function closeDialog() {
  dialogVisible.value = false
}

function validate() {
  errors.value = ''
  errors.password = ''
  let ok = true

  if (dialogType.value === 'name') {
    if (!form.value) {
      errors.value = '请输入用户名'
      ok = false
    } else if (form.value === userStore.name) {
      errors.value = '新用户名不能与当前用户名相同'
      ok = false
    }
  } else if (dialogType.value === 'phone') {
    if (!form.value) {
      errors.value = '请输入手机号'
      ok = false
    } else if (!REGEX.phone.test(form.value)) {
      errors.value = '手机号格式不正确'
      ok = false
    }
  } else if (dialogType.value === 'email') {
    if (!form.value) {
      errors.value = '请输入邮箱'
      ok = false
    } else if (!REGEX.email.test(form.value)) {
      errors.value = '邮箱格式不正确'
      ok = false
    }
  } else if (dialogType.value === 'password') {
    if (!form.value) {
      errors.value = '请输入新密码'
      ok = false
    } else if (!REGEX.password.test(form.value)) {
      errors.value = '密码格式不符合要求（5-11位字母数字@_.）'
      ok = false
    }
  }
  if (!form.password) {
    errors.password = '请输入当前密码'
    ok = false
  }
  return ok
}

async function submit() {
  if (!validate()) return
  submitting.value = true

  try {
    let url = ''
    const payload = { token: localStorage.getItem('token'), password: form.password }
    if (dialogType.value === 'name') {
      url = '/updateusername'
      payload.u_name = form.value
    } else if (dialogType.value === 'phone') {
      url = '/updatephone'
      payload.phone = form.value
    } else if (dialogType.value === 'email') {
      url = '/updateemail'
      payload.email = form.value
    } else {
      url = '/updatepassword'
      payload.newPassword = form.value
    }
    const res = await axios.post('http://localhost:3000' + `${url}`, payload)
    if (res.data.status === 200) {
      if (dialogType.value === 'name') {
        userStore.name = form.value
        const newToken = res.data.data?.token
        if (newToken) {
          localStorage.setItem('token', newToken)
          userStore.token = newToken
        }
      } else if (dialogType.value === 'phone') {
        userStore.phone = form.value
      } else if (dialogType.value === 'email') {
        userStore.email = form.value
      } else if (dialogType.value === 'password') {
        const newToken = res.data.data?.token
        if (newToken) {
          localStorage.setItem('token', newToken)
          userStore.token = newToken
        }
      }
      alert('修改成功')
      closeDialog()
    } else {
      const msg = res.data.error || '操作失败'
      if (msg.includes('当前密码') || msg === '密码错误') {
        errors.password = msg
      } else {
        errors.value = msg
      }
    }
  } catch (err) {
    errors.value = '网络错误，请稍后重试'
  } finally {
    submitting.value = false
  }
}

const userDialogVisible = ref(false)
const userList = ref([])
const userListError = ref('')
const loadingUsers = ref(false)

async function openUserDialog() {
  userDialogVisible.value = true
  await loadUsers()
}

async function loadUsers() {
  loadingUsers.value = true
  userListError.value = ''
  try {
    const res = await axios.post('http://localhost:3000/getusers', {
      token: localStorage.getItem('token')
    })
    if (res.data.status === 200) {
      userList.value = res.data.data || []
    } else {
      userListError.value = res.data.error || '获取用户列表失败'
    }
  } catch (err) {
    userListError.value = '网络错误，请稍后重试'
  } finally {
    loadingUsers.value = false
  }
}

function closeUserDialog() {
  userDialogVisible.value = false
}

const deleteDialogVisible = ref(false)
const deleteTarget = ref(null)
const deletePassword = ref('')
const deleteError = ref('')
const deleting = ref(false)

function promptDelete(u) {
  deleteTarget.value = u
  deletePassword.value = ''
  deleteError.value = ''
  deleteDialogVisible.value = true
}

function closeDeleteDialog() {
  deleteDialogVisible.value = false
}

async function confirmDelete() {
  deleteError.value = ''
  if (!deletePassword.value) {
    deleteError.value = '请输入管理员密码'
    return
  }
  deleting.value = true
  try {
    const res = await axios.post('http://localhost:3000/deleteuser', {
      token: localStorage.getItem('token'),
      password: deletePassword.value,
      u_id: deleteTarget.value.u_id
    })
    if (res.data.status === 200) {
      alert('删除成功')
      deleteDialogVisible.value = false
      await loadUsers()
    } else {
      deleteError.value = res.data.error || '删除失败'
    }
  } catch (err) {
    deleteError.value = '网络错误，请稍后重试'
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
.user-info {
  margin: 5vh auto;
  max-width: 720px;
  padding: 0 16px;
  box-sizing: border-box;
}

.header {
  text-align: center;
  margin-bottom: 32px;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 12px;
  display: block;
  border: 2px solid #409eff;
}

.username {
  font-size: 20px;
  font-weight: 600;
  color: #222;
  margin: 0;
}

.section {
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  padding: 8px 24px 12px;
  margin-bottom: 16px;
}

.section h2 {
  font-size: 14px;
  color: #888;
  font-weight: 500;
  margin: 16px 0 4px;
}

.info-row {
  display: flex;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.label {
  width: 80px;
  color: #666;
  font-size: 14px;
}

.value {
  flex: 1;
  color: #333;
  font-size: 14px;
}

.action-btn {
  padding: 6px 14px;
  font-size: 13px;
  color: #409eff;
  background: #fff;
  border: 1px solid #409eff;
  border-radius: 6px;
}

.action-btn:hover {
  background: #ecf5ff;
}

.logout-wrap {
  text-align: center;
  margin-top: 8px;
}

.logout-btn {
  width: 100%;
  padding: 12px 16px;
  font-size: 15px;
  color: #ef4444;
  background: #fff;
  border: 1px solid #ef4444;
  border-radius: 8px;
}

.logout-btn:hover {
  background: #fef2f2;
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
  width: 380px;
  max-width: 90vw;
  background: #fff;
  border-radius: 10px;
  padding: 24px;
  box-sizing: border-box;
}

.modal h3 {
  margin: 0 0 20px;
  font-size: 17px;
  color: #222;
}

.user-modal {
  width: 520px;
}

.form-item {
  margin-bottom: 8px;
}

.form-item label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.input {
  width: 100%;
  padding: 10px 12px;
  font-size: 14px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  box-sizing: border-box;
  outline: none;
}

.input:focus {
  border-color: #409eff;
}

.error {
  font-size: 13px;
  color: #ef4444;
  margin-top: 8px;
  min-height: 20px;
}

.loading-tip {
  font-size: 13px;
  color: #999;
  padding: 16px 0;
  text-align: center;
}

.delete-tip {
  font-size: 14px;
  color: #555;
  margin: 0 0 12px;
  line-height: 1.6;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 12px;
}

.btn {
  min-width: 78px;
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

.btn.danger {
  color: #fff;
  background: #ef4444;
  border-color: #ef4444;
}

.btn.danger:hover {
  background: #f87171;
  border-color: #f87171;
}

.user-list {
  max-height: 380px;
  overflow-y: auto;
  margin-bottom: 4px;
}

.user-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.user-item:last-child {
  border-bottom: none;
}

.user-main {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.u-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.u-detail {
  font-size: 12px;
  color: #999;
  word-break: break-all;
}

.u-role {
  font-size: 12px;
  color: #409eff;
}
</style>