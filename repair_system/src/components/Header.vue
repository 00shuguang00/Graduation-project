<template>
  <div>
    {{ title }}
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const titlemap = {
  '/roothome/addadmin': '添加维修工',
  '/roothome/handlematerial': '物资审批',
  '/roothome/employeestats': '统计',
  '/roothome/announcement': '公告',
  '/roothome/userinfo': '个人信息',
  
  '/adminhome/repairstatus': '处理报修',
  '/adminhome/materialrequest': '申请物资',
  '/adminhome/statistics': '统计',
  '/adminhome/announcement': '公告',
  '/adminhome/userinfo': '个人信息',

  '/userhome/repairform': '填写报修单',
  '/userhome/repairstatus': '报修查询',
  '/userhome/announcement': '公告',
  '/userhome/userinfo': '个人信息'
}

const title = computed(() => titlemap[route.path] || '')
</script>

<style scoped>
div {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 5vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fff;
}
</style>