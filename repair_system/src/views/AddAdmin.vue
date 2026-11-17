<template>
  <div class="register-container">
    <div class="register-card">
      <h2>添加管理员</h2>
      <div class="form-group">
        <input type="text" placeholder="用户名" v-model="u_name" required />
      </div>
      <div class="error">{{ nameerr }}</div>
      <div class="form-group">
        <input type="text" placeholder="手机号" v-model="phone" />
      </div>
      <div class="error">{{ phoneerr }}</div>
      <div class="form-group">
        <input type="text" placeholder="邮箱" v-model="email" />
      </div>
      <div class="error">{{ emailerr }}</div>
      <div class="form-group">
        <input type="password" placeholder="密码" v-model="password" required />
      </div>
      <div class="error">{{ passworderr }}</div>
      <button class="btn-register" @click="register">添加</button>
    </div>
  </div>
</template>

<script setup>
import axios from "axios";
import { ref } from "vue";
const u_name = ref("");
const phone = ref("");
const email = ref("");
const password = ref("");
const nameerr = ref("");
const passworderr = ref("");
const phoneerr = ref("");
const emailerr = ref("");
function register() {
  if (!u_name.value) {
    nameerr.value = "用户名不能为空";
  }
  if (!password.value) {
    passworderr.value = "密码不能为空";
  }
  if (!phone.value && !email.value) {
    phoneerr.value = "手机号或邮箱至少填写一个";
  }
  const REGEX = {
    phone: /^[0-9]{11}$/,
    email: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/,
    username: /^(?!\d+$)(?![0-9_])[a-zA-Z0-9_\u4e00-\u9fa5]{2,12}$/,
    password: /^[A-Za-z0-9@_.]{5,11}$/,
  };
  if (!REGEX.username.test(u_name.value)) {
    nameerr.value = "用户名格式不正确";
  } else {
    nameerr.value = "";
  }
  if (!REGEX.password.test(password.value)) {
    passworderr.value = "密码格式不正确";
  } else {
    passworderr.value = "";
  }
  if (phone.value && !REGEX.phone.test(phone.value)) {
    phoneerr.value = "手机号格式不正确";
  } else {
    phoneerr.value = "";
  }
  if (email.value && !REGEX.email.test(email.value)) {
    emailerr.value = "邮箱格式不正确";
  } else {
    emailerr.value = "";
  }
  if (nameerr.value || passworderr.value || phoneerr.value || emailerr.value) {
    return;
  }
  axios
    .post("http://localhost:3000/addadmin", {
      u_name: u_name.value,
      phone: phone.value,
      email: email.value,
      password: password.value,
      token: localStorage.getItem("token"),
    })
    .then((res) => {
      console.log(res.data);
    });
}
</script>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 90vh;
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
  margin-bottom: 18px;
}

.form-group input {
  width: 100%;
  padding: 10px 14px;
  font-size: 15px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fafbfc;
  box-sizing: border-box;
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
  margin-top: 4px;
  min-height: 20px;
}
</style>