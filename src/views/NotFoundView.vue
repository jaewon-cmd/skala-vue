<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => router.push('/')
</script>

<template>
  <div class="notfound-wrap glass-card">
    <div class="code">404</div>
    <p class="msg">요청하신 페이지를 찾을 수 없습니다.</p>
    <button class="home-btn" @click="goHome">메인 대시보드로 돌아가기</button>
  </div>
</template>

<style scoped>
.notfound-wrap {
  max-width: 500px;
  margin: 0 auto;
  padding: 48px 24px;
  text-align: center;
}
.code {
  font-size: 80px;
  font-weight: 800;
  line-height: 1.1;
  color: #cbd5e1;
}
.msg {
  font-size: 16px;
  color: #4b5563;
  margin: 8px 0 24px;
}
.home-btn {
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  background: #0ea5e9;
  color: #fff;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}
.home-btn:hover {
  background: #0284c7;
}
</style>
