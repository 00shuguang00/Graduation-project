<template>
  <div>
    <Header></Header>
    <router-view></router-view>
    <AdminFooter></AdminFooter>
    </div>
</template>

<script setup>
import AdminFooter from '@/components/AdminFooter.vue';
import Header from '../components/Header.vue'
</script>

<style>

</style>