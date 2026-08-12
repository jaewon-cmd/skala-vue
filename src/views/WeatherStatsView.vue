<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
const weatherList = [
  { id: 'city_01', name: '서울', temp: 28, status: '맑음', humidity: 60, wind: 2.1, feelsLike: 29 },
  { id: 'city_02', name: '수원', temp: 24, status: '비', humidity: 85, wind: 3.4, feelsLike: 25 },
  { id: 'city_03', name: '부산', temp: 23, status: '비', humidity: 88, wind: 4.2, feelsLike: 24 },
  { id: 'city_05', name: '강릉', temp: 25.9, status: '구름', humidity: 65, wind: 5.1, feelsLike: 26 },
  { id: 'city_06', name: '광주', temp: 30.5, status: '구름', humidity: 55, wind: 1.8, feelsLike: 33 },
  { id: 'city_07', name: '제주', temp: 28.1, status: '맑음', humidity: 72, wind: 6.3, feelsLike: 30 },
  { id: 'city_08', name: '대구', temp: 35, status: '맑음', humidity: 45, wind: 1.2, feelsLike: 39 },
  { id: 'city_09', name: '울릉/독도', temp: 25.5, status: '비', humidity: 90, wind: 7.5, feelsLike: 26 },
]

const router = useRouter()

// 전체 도시 수
const totalCount = computed(() => weatherList.length)

// 평균 기온
const averageTemp = computed(() => {
  const sum = weatherList.reduce((acc, c) => acc + c.temp, 0)
  return (sum / weatherList.length).toFixed(1)
})

// 최고 기온 도시
const hottest = computed(() => weatherList.reduce((a, b) => (b.temp > a.temp ? b : a)))

// 최저 기온 도시
const coldest = computed(() => weatherList.reduce((a, b) => (b.temp < a.temp ? b : a)))

// 더운 도시 수 (25도 이상)
const hotCount = computed(() => weatherList.filter((c) => c.temp >= 25).length)

// 강수 도시 수 (비, 눈)
const rainyCount = computed(() => weatherList.filter((c) => c.status === '비' || c.status === '눈').length)

const goHome = () => router.push('/')
</script>

<template>
  <div class="stats-wrap">
    <h1>📊 날씨 통계</h1>

    <div class="stat-grid">
      <div class="stat-card">
        <span>전체 도시</span>
        <strong>{{ totalCount }}곳</strong>
      </div>
      <div class="stat-card">
        <span>평균 기온</span>
        <strong>{{ averageTemp }}°C</strong>
      </div>
      <div class="stat-card">
        <span>더운 도시 (25° 이상)</span>
        <strong>{{ hotCount }}곳</strong>
      </div>
      <div class="stat-card">
        <span>강수 도시 (비/눈)</span>
        <strong>{{ rainyCount }}곳</strong>
      </div>
      <div class="stat-card hot">
        <span>최고 기온</span>
        <strong>{{ hottest.name }} · {{ hottest.temp }}°C</strong>
      </div>
      <div class="stat-card cool">
        <span>최저 기온</span>
        <strong>{{ coldest.name }} · {{ coldest.temp }}°C</strong>
      </div>
    </div>

    <button class="home-btn" @click="goHome">메인 대시보드로 돌아가기</button>
  </div>
</template>

<style scoped>
.stats-wrap {
  max-width: 700px;
  margin: 0 auto;
}
.stats-wrap h1 {
  font-size: 22px;
  margin-bottom: 16px;
}
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 20px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 18px;
}
.stat-card span {
  font-size: 13px;
  color: #6b7280;
}
.stat-card strong {
  font-size: 22px;
  color: #1f2937;
}
.stat-card.hot {
  border-top: 4px solid #ef4444;
}
.stat-card.cool {
  border-top: 4px solid #3b82f6;
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
