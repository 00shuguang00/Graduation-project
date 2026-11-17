<template>
  <div class="bottom-nav">
    <router-link to="/roothome/addAdmin">
      <i class="iconfont">&#xe672;</i>
      <span>添加维修工</span>
    </router-link>
    <router-link to="/roothome/handlematerial">
      <i class="iconfont">&#xe743;</i>
      <span>物资审批</span>
    </router-link>
    <router-link to="/roothome/employeestats">
      <i class="iconfont">&#xe659;</i>
      <span>统计</span>
    </router-link>
    <router-link to="/roothome/announcement">
      <i class="iconfont">&#xe8c4;</i>
      <span>公告</span>
    </router-link>
    <router-link to="/roothome/userinfo">
      <i class="iconfont">&#xe60a;</i>
      <span>个人信息</span>
    </router-link>
  </div>
</template>

<script setup>
</script>

<style scoped>
@font-face {
  font-family: "iconfont";
  src: url('@/static/font_d24cq6t60f6/iconfont.ttf') format('truetype');
}

.iconfont {
  font-family: "iconfont" !important;
  font-size: 22px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100vw;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  background: #fff;
  border-top: 1px solid #f0f0f0;
}

.bottom-nav a {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #666;
  text-decoration: none;
  font-size: 12px;
  gap: 4px;
}

.bottom-nav a.router-link-active {
  color: red;
}

.bottom-nav a.router-link-active .iconfont {
  color: red;
}
</style>