<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseDashboardCard from '@/components/exercise/BaseDashboardCard.vue'
import SearchBar from '@/components/exercise/SearchBar.vue'
import WeatherCard from '@/components/exercise/WeatherCard.vue'
import { useConfigStore } from '@/stores/configStore.js'

const configStore = useConfigStore()
const toDisplay = (celsius) => (configStore.unit === 'fahrenheit' ? Math.round((celsius * 9) / 5 + 32) : celsius)

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

const router = useRouter() //  코드로 페이지 이동하려고 가져옴

const cities = ref(weatherList) // 공유 Mock Data
const searchQuery = ref('')
const minTemp = ref(0)
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

const filteredList = computed(() => cities.value.filter((c) => c.name.includes(searchQuery.value) && toDisplay(c.temp) >= minTemp.value))
const handleUpdateQuery = (q) => (searchQuery.value = q)
const handleUpdateMinTemp = (t) => (minTemp.value = t)
const handleSelectCard = (name) => (selectedCityInfo.value = `${name}이(가) 선택되었습니다.`)

//  상세보기 → window.alert() 대신 상세 페이지로 이동
const handleClickDetail = (city) => {
  router.push('/weather/' + city.id) // 예: /weather/city_01
}
</script>

<template>
  <div class="home-wrap">
    <h1>🏙️ 지역별 날씨 대시보드</h1>

    <BaseDashboardCard title="🔍 도시 검색">
      <SearchBar :search-query="searchQuery" :min-temp="minTemp" @update-query="handleUpdateQuery" @update-min-temp="handleUpdateMinTemp" />
    </BaseDashboardCard>

    <BaseDashboardCard title="🌦️ 지역별 날씨 현황">
      <div v-if="filteredList.length === 0" class="empty">🔍 검색 결과와 일치하는 도시가 없습니다.</div>
      <div v-else class="card-grid">
        <WeatherCard v-for="item in filteredList" :key="item.id" :city="item" @select-card="handleSelectCard" @click-detail="handleClickDetail" />
      </div>
    </BaseDashboardCard>

    <div class="status-bar">{{ selectedCityInfo }}</div>
  </div>
</template>

<style scoped>
.home-wrap {
  max-width: 900px;
  margin: 0 auto;
}
.home-wrap h1 {
  font-size: 22px;
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
