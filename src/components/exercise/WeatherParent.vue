<script setup>
import { ref, computed, watch, watchEffect } from 'vue'
import BaseDashboardCard from './BaseDashboardCard.vue'
import SearchBar from './SearchBar.vue'
import WeatherCard from './WeatherCard.vue'

/* 1. 반응형 상태 — 전부 부모가 보유 */
const searchQuery = ref('')
const minTemp = ref(0)
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')
const clickCount = ref(0)
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 23, status: '비' },
  { id: 'city_05', name: '강릉', temp: 25.9, status: '구름' },
  { id: 'city_06', name: '광주', temp: 30.5, status: '구름' },
  { id: 'city_07', name: '제주', temp: 28.1, status: '맑음' },
  { id: 'city_08', name: '대구', temp: 35, status: '맑음' },
  { id: 'city_09', name: '울릉/독도', temp: 25.5, status: '비' },
])

/* 2. computed — 검색어 + 최소기온 필터 */
const filteredWeatherList = computed(() => weatherList.value.filter((city) => city.name.includes(searchQuery.value) && city.temp >= minTemp.value))
/* 5. 추가 computed — 평균 기온 */
const averageTemp = computed(() => {
  const sum = weatherList.value.reduce((acc, c) => acc + c.temp, 0)
  return (sum / weatherList.value.length).toFixed(1)
})

/* 3. watch / watchEffect */
watch(selectedCityInfo, (n, o) => console.log(`👁️ [상태바 변경] "${o}" ➡️ "${n}"`))
watch(minTemp, (n, o) => console.log(`🌡️ [필터 변경] ${o}°C ➡️ ${n}°C (${filteredWeatherList.value.length}곳)`))
watch(clickCount, (c) => console.log(`🖱️ [클릭 횟수] 총 ${c}번`))
watchEffect(() => console.log(`🔍 [검색어 추적] "${searchQuery.value}"`))

/* 자식 emit을 받아 처리하는 핸들러들 */
const handleUpdateQuery = (query) => (searchQuery.value = query) // SearchBar → 검색어
const handleUpdateMinTemp = (temp) => (minTemp.value = temp) // SearchBar → 최소기온
const handleSelectCard = (name) => {
  selectedCityInfo.value = `${name}이(가) 선택되었습니다.`
  clickCount.value++
}
const handleClickDetail = (city) => window.alert(`${city.name}의 현재 날씨는 [${city.status}] 상태입니다.`)
</script>

<template>
  <div class="parent-wrap">
    <!-- 검색 박스: BaseDashboardCard(slot)로 감싸 SearchBar 주입 -->
    <BaseDashboardCard title="🔍 도시 검색">
      <SearchBar :search-query="searchQuery" :min-temp="minTemp" @update-query="handleUpdateQuery" @update-min-temp="handleUpdateMinTemp" />
    </BaseDashboardCard>

    <!-- 정보 패널 (평균기온·클릭수·검색결과) -->
    <section class="info-box">
      <span
        >📊 평균 기온: <strong>{{ averageTemp }}°C</strong></span
      >
      <span
        >🖱️ 카드 클릭: <strong>{{ clickCount }}</strong
        >회</span
      >
      <span
        >🏙️ 검색 결과: <strong>{{ filteredWeatherList.length }}</strong
        >곳</span
      >
    </section>

    <!-- 리스트 박스: slot에 WeatherCard 목록 주입 -->
    <BaseDashboardCard title="🏙️ 지역별 날씨 현황">
      <div v-if="filteredWeatherList.length === 0" class="empty">🔍 검색 결과와 일치하는 도시가 없습니다.</div>
      <div v-else class="card-grid">
        <WeatherCard
          v-for="item in filteredWeatherList"
          :key="item.id"
          :city="item"
          @select-card="handleSelectCard"
          @click-detail="handleClickDetail"
        />
      </div>
    </BaseDashboardCard>

    <div class="status-bar">{{ selectedCityInfo }}</div>
  </div>
</template>

<style scoped>
.parent-wrap {
  max-width: 820px;
  margin: 0 auto;
  font-family:
    'Pretendard',
    -apple-system,
    sans-serif;
  color: #333;
}
.info-box {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 14px;
  color: #4b5563;
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.empty {
  padding: 30px;
  text-align: center;
  color: #9ca3af;
  font-size: 15px;
  background: #fff;
  border: 1px dashed #d1d5db;
  border-radius: 12px;
}
.status-bar {
  margin-top: 16px;
  padding: 14px;
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 10px;
  text-align: center;
  font-size: 14px;
  color: #047857;
  font-weight: 500;
}
</style>
