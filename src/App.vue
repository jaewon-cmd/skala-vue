<script setup>
import AppContainer from './components/layout/AppContainer.vue'
</script>

<template>
  <AppContainer>
    <RouterView />
  </AppContainer>
</template>

<style>
@import '@/assets/exercise.css';

html,
body,
#app {
  margin: 0;
  padding: 0;
  min-height: 100vh;
}
</style>
