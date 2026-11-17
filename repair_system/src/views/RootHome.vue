<template>
  <div>
    <Header></Header>
    <router-view></router-view>
    <RootFooter></RootFooter>
  </div>
</template>

<script setup>
import Header from '../components/Header.vue'
import RootFooter from '../components/RootFooter.vue';

</script>

<style>

</style>