<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

const goHome = () => router.push('/')
</script>

<template>
  <div class="about-wrap">
    <h1>ℹ️ 서비스 소개</h1>

    <div class="about-card">
      <p>이 서비스는 Vue 3와 Vue Router로 만든 <strong>지역별 날씨 대시보드</strong>입니다.</p>
      <p>
        지역별 현재 기온과 날씨 상태를 카드로 확인하고, 각 도시의 상세 기상관측 정보를 조회할 수
        있습니다.
      </p>

      <h3>주요 기능</h3>
      <ul>
        <li>도시 검색 및 최소 기온 필터</li>
        <li>온도/강수 상태에 따른 시각적 구분</li>
        <li>도시별 상세 페이지 (동적 라우팅)</li>
      </ul>
    </div>

    <button class="home-btn" @click="goHome">메인 대시보드로 돌아가기</button>
  </div>
</template>

<style scoped>
.about-wrap {
  max-width: 600px;
  margin: 0 auto;
}
.about-wrap h1 {
  font-size: 22px;
  margin-bottom: 16px;
}
.about-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 24px;
  line-height: 1.7;
  margin-bottom: 16px;
}
.about-card h3 {
  font-size: 15px;
  color: #4b5563;
  margin: 20px 0 8px;
}
.about-card ul {
  margin: 0;
  padding-left: 20px;
  color: #4b5563;
}
.about-card li {
  margin-bottom: 4px;
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
