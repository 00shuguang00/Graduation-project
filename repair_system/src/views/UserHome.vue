<template>
    <div>
        <Header></Header>
        <router-view></router-view>
        <UserFooter></UserFooter>
    </div>
    
</template>

<script setup>
import Header from '../components/Header.vue'
import UserFooter from '../components/UserFooter.vue';

</script>

<style>

</style>