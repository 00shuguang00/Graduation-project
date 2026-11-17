<template>
  <div class="login-container">
    <div class="login-card">
      <h2>登录</h2>
      <div class="form-group">
        <input
          type="text"
          placeholder="用户名/邮箱/手机号"
          v-model.trim="account"
          required
        />
        <div class="error">{{ nameerr }}</div>
      </div>
      <div class="form-group">
        <input type="password" placeholder="密码" v-model.trim="password" required />
        <div class="error">{{ passworderr }}</div>
      </div>
      <button class="btn-login" @click="login">登录</button>
      <button class="btn-register" @click="$router.push('/register')">
        去注册
      </button>
    </div>
  </div>
</template>

<script setup>
import axios from "axios"
import { ref } from "vue"
import { useRouter } from "vue-router"
const router = useRouter()
const account = ref("")
const password = ref("")
const nameerr = ref("")
const passworderr = ref("")
function login() {
  if (!account.value) {
    nameerr.value = "用户名不能为空"
  }
  if (!password.value) {
    passworderr.value = "密码不能为空"
  }
  if(!account.value || !password.value){
    return
  }
  axios
    .post("http://localhost:3000/Login", {
      account: account.value,
      password: password.value,
    })
    .then((res) => {
      console.log(res.data)
      const userinfo = res.data.data
      if (userinfo.role == "root") {
        localStorage.setItem("token", userinfo.token)
        router.push("/roothome/addadmin")
      } else if(userinfo.role == "admin") {
        localStorage.setItem("token", userinfo.token)
        router.push("/adminhome/repairstatus")
      }else{
        localStorage.setItem("token", userinfo.token)
        router.push("/userhome/repairform")
      }
    })
    .catch(err=>{
      console.log(err)
    })
}
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f7fa;
  padding: 20px;
}
.login-card {
  width: 100%;
  max-width: 380px;
  background: #ffffff;
  border-radius: 12px;
  padding: 36px 28px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.login-card h2 {
  text-align: center;
  font-weight: 600;
  font-size: 24px;
  color: #1e293b;
  margin-bottom: 28px;
}
.form-group {
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

.btn-login {
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

.btn-login:hover {
  background: #2563eb;
}

.btn-register {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  background: transparent;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.btn-register:hover {
  background: #f1f5f9;
}

.error {
  font-size: 13px;
  color: #ef4444;
  margin-top: 8px;
  min-height: 20px;
}
</style>