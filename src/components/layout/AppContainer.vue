<script setup>
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import UnitToggler from '@/components/exercise/UnitToggler.vue'
import WeatherBackground from '@/components/layout/WeatherBackground.vue'
import { useWeatherStore } from '@/stores/weatherStore.js'

const weatherStore = useWeatherStore()
const { currentWeather } = storeToRefs(weatherStore)

// 현재 지역의 날씨 상태 (없으면 맑음)
const currentStatus = computed(() => currentWeather.value?.status ?? '맑음')
</script>

<template>
  <div class="app-shell">
    <WeatherBackground :status="currentStatus" />
    <div class="app-card">
      <div class="app-topbar">
        <header class="app-header">
          <h1 class="app-title">⛅ SKALA 일기예보</h1>
          <p class="app-subtitle">실시간 날씨 · 5일 예보 · 미세먼지</p>
        </header>

        <nav class="navigation-bar">
          <div class="nav-links">
            <RouterLink to="/" class="nav-item">🌦️ 대시보드</RouterLink>
            <RouterLink to="/about" class="nav-item">ℹ️ 서비스 소개</RouterLink>
            <RouterLink to="/stats" class="nav-item">📊 통계</RouterLink>
            <RouterLink to="/range" class="nav-item">📅 날짜별 조회</RouterLink>
          </div>
          <UnitToggler class="unit-slot" />
        </nav>
      </div>

      <main class="app-main">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  --panel-alpha: 0.85;

  min-height: 100vh;
  background: transparent;
  padding: 24px 20px;
  box-sizing: border-box;
}
.app-card {
  width: 100%;
  max-width: 1000px;
  margin: 0 auto;
  background: transparent;
  border-radius: 0;
  box-shadow: none;
  padding: 20px 24px;
  box-sizing: border-box;
}

.app-header {
  text-align: left;
  margin-bottom: 20px;
}

.app-title {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}
.app-subtitle {
  margin: 6px 0 0;
  color: rgba(255, 255, 255, 0.92);
  font-size: 14px;
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
}

.navigation-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  margin-bottom: 24px;
  background: #f5f7fa;
  border-radius: 12px;
}
.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.nav-item {
  padding: 8px 14px;
  border-radius: 8px;
  text-decoration: none;
  color: #606266;
  font-weight: 600;
  font-size: 14px;
  transition:
    background 0.15s,
    color 0.15s;
}
.nav-item:hover {
  background: #e9eef5;
  color: #409eff;
}
.nav-item.router-link-exact-active {
  background: #ecf5ff;
  color: #409eff;
}
.unit-slot {
  margin-left: auto;
}

.app-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.app-header {
  text-align: left;
  margin: 0;
}

.navigation-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin: 0;
  background: rgba(255, 255, 255, var(--panel-alpha));
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 16px rgba(31, 45, 61, 0.1);
}

.unit-slot {
  margin-left: 12px;
}

/* 본문은 그 자체가 패널이 아니라 유리 카드들을 담는 빈 틀이다.
   카드 사이 간격으로 3D 배경이 비쳐 보인다. */
.app-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: transparent;
}
</style>
