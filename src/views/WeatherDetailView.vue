<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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

const route = useRoute()
const router = useRouter()

const city = ref(null)

const statusIcon = (status) => {
  const map = { 맑음: '☀️', 비: '🌧️', 구름: '☁️', 바람: '💨', 눈: '❄️' }
  return map[status] ?? '🌡️'
}

// 마운트 시점에 주소의 cityId로 도시 객체 선택
onMounted(() => {
  const cityId = route.params.cityId
  city.value = weatherList.find((c) => c.id === cityId) || null
})

const goBack = () => router.push('/')
</script>

<template>
  <div class="detail-wrap">
    <button class="back-btn" @click="goBack">← 대시보드로 돌아가기</button>

    <div v-if="city" class="detail-card">
      <div class="detail-head">
        <span class="detail-icon">{{ statusIcon(city.status) }}</span>
        <div class="head-text">
          <h1>{{ city.name }}</h1>
          <p class="status">{{ city.status }}</p>
        </div>
        <div class="big-temp">{{ city.temp }}°</div>
      </div>

      <h3>상세 기상관측 정보</h3>
      <div class="metric-grid">
        <div class="metric">
          <span>체감온도</span><strong>{{ city.feelsLike ?? '-' }}°C</strong>
        </div>
        <div class="metric">
          <span>습도</span><strong>{{ city.humidity ?? '-' }}%</strong>
        </div>
        <div class="metric">
          <span>풍속</span><strong>{{ city.wind ?? '-' }}m/s</strong>
        </div>
        <div class="metric">
          <span>도시 코드</span><strong>{{ city.id }}</strong>
        </div>
      </div>
    </div>

    <div v-else class="not-found">'{{ route.params.cityId }}'에 해당하는 도시를 찾을 수 없습니다.</div>
  </div>
</template>

<style scoped>
.detail-wrap {
  max-width: 600px;
  margin: 0 auto;
}
.back-btn {
  padding: 8px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  margin-bottom: 16px;
}
.back-btn:hover {
  background: #f3f4f6;
}
.detail-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 24px;
}
.detail-head {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}
.detail-icon {
  font-size: 56px;
}
.head-text h1 {
  margin: 0;
  font-size: 26px;
}
.status {
  margin: 4px 0 0;
  color: #9ca3af;
}
.big-temp {
  margin-left: auto;
  font-size: 52px;
  font-weight: 800;
  color: #1f2937;
}
.detail-card h3 {
  font-size: 15px;
  color: #4b5563;
  margin-bottom: 12px;
}
.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.metric {
  display: flex;
  justify-content: space-between;
  padding: 14px 16px;
  background: #f8f9fa;
  border-radius: 10px;
  font-size: 14px;
}
.metric strong {
  color: #1f2937;
}
.not-found {
  padding: 40px;
  text-align: center;
  color: #dc2626;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 12px;
}
</style>
