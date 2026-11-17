<template>
  <div class="register-container">
    <div class="register-card">
      <h2>注册</h2>

      <div class="form-group">
        <input type="text" placeholder="用户名" v-model.trim="u_name" required />
        <div class="error">{{ nameerr }}</div>
      </div>

      <div class="form-group">
        <input type="text" placeholder="手机号" v-model.trim="phone" />
        <div class="error">{{ phoneerr }}</div>
      </div>

      <div class="form-group">
        <input type="text" placeholder="邮箱" v-model.trim="email" />
        <div class="error">{{ emailerr }}</div>
      </div>

      <div class="form-group">
        <input type="password" placeholder="密码" v-model.trim="password" required />
        <div class="error">{{ passworderr }}</div>
      </div>

      <button class="btn-register" @click="register">注册</button>
      <button class="btn-login" @click="$router.push('/Login')">去登录</button>
    </div>
  </div>
</template>

<script setup>
import axios from "axios"
import { ref } from "vue"
import { useRouter } from "vue-router"
import { useCounterStore } from "../stores/counter.js"
const router = useRouter()
const userStore = useCounterStore()
const u_name = ref("")
const phone = ref("")
const email = ref("")
const password = ref("")
const nameerr = ref("")
const passworderr = ref("")
const phoneerr = ref("")
const emailerr = ref("")
const REGEX = {
  phone: /^[0-9]{11}$/,
  email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
  username: /^(?!\d+$)(?![0-9_])[a-zA-Z0-9_\u4e00-\u9fa5]{2,12}$/,
  password: /^[A-Za-z0-9@_.]{5,11}$/,
}
function register() {
  if (!u_name.value) {
    nameerr.value = "用户名不能为空"
  } else if (!REGEX.username.test(u_name.value)) {
    nameerr.value = "用户名格式不正确"
  } else {
    nameerr.value = ""
  }

  if (!password.value) {
    passworderr.value = "密码不能为空"
  } else if (!REGEX.password.test(password.value)) {
    passworderr.value = "密码格式不正确"
  } else {
    passworderr.value = ""
  }

  if (phone.value && !REGEX.phone.test(phone.value)) {
    phoneerr.value = "手机号格式不正确"
  } else {
    phoneerr.value = ""
  }
  if (email.value && !REGEX.email.test(email.value)) {
    emailerr.value = "邮箱格式不正确"
  } else {
    emailerr.value = ""
  }
  if (!phone.value && !email.value) {
    phoneerr.value = "手机号或邮箱至少填写一个"
  }

  if (nameerr.value || passworderr.value || phoneerr.value || emailerr.value) {
    return
  }
  axios
    .post("http://localhost:3000/Register", {
      u_name: u_name.value,
      phone: phone.value,
      email: email.value,
      password: password.value,
    })
    .then((res) => {
      if (res.data.status !== 200) {
        alert(res.data.error || res.data.message || "注册失败")
        return
      }
      const userinfo = res.data.data
      localStorage.setItem("token", userinfo.token)
      userStore.setUserInfo({
        id: userinfo.id,
        name: userinfo.name,
        phone: userinfo.phone,
        email: userinfo.email,
        role: userinfo.role,
        image: userinfo.image,
      })
      router.replace("/userhome/repairform")
    })
    .catch((err) => {
      console.log(err)
      alert("注册失败，请检查网络或服务器")
    })
}
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}

.register-card {
  width: 100%;
  max-width: 380px;
  background: #ffffff;
  border-radius: 12px;
  padding: 36px 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.register-card h2 {
  text-align: center;
  font-weight: 600;
  font-size: 24px;
  color: #1e293b;
  margin-bottom: 28px;
}

.form-group {
  height: 66px;
  margin-bottom: 18px;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  font-size: 15px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  outline: none;
  background: #fafbfc;
}

.form-group input:focus {
  border-color: #3b82f6;
  background: #ffffff;
}


.btn-register {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  margin-bottom: 10px;
}

.btn-register:hover {
  background: #2563eb;
}


.btn-login {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.btn-login:hover {
  background: #f1f5f9;
}

.error {
  font-size: 13px;
  color: #ef4444;
  margin-top: 8px;
  min-height: 20px;
}
</style>