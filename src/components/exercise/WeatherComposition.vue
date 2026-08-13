<script setup>
import { ref, computed, watch, watchEffect } from 'vue'

/* 1. 반응형 상태 (과제 1과 동일) */
const searchQuery = ref('')
const minTemp = ref(0) // (추가 상태) 최소 기온 필터
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')
const weatherList = ref([
  { id: 'city_01', name: '서울', temp: 28, status: '맑음' },
  { id: 'city_02', name: '수원', temp: 24, status: '비' },
  { id: 'city_03', name: '부산', temp: 26, status: '구름' },
  { id: 'city_05', name: '강릉', temp: 25.9, status: '구름' },
  { id: 'city_06', name: '광주', temp: 30.5, status: '구름' },
  { id: 'city_07', name: '제주', temp: 28.1, status: '맑음' },
  { id: 'city_08', name: '대구', temp: 29.1, status: '비' },
  { id: 'city_09', name: '울릉/독도', temp: 25.5, status: '비' },
])

/* 2. computed - 검색어가 이름에 포함된 도시만 필터링 */
const filteredWeatherList = computed(() =>
  weatherList.value.filter((city) => city.name.includes(searchQuery.value) && city.temp >= minTemp.value),
) /* 3-1. watch - 상태바(selectedCityInfo)가 바뀔 때마다 콘솔 로그 */
watch(selectedCityInfo, (newVal, oldVal) => {
  console.log(`👁️ [상태바 변경] "${oldVal}" ➡️ "${newVal}"`)
})
watch(minTemp, (newVal, oldVal) => {
  // (추가 watcher) 최소 기온 필터가 바뀔 때마다 로그
  console.log(`🌡️ [필터 변경] 최소 기온 ${oldVal}°C ➡️ ${newVal}°C (${filteredWeatherList.value.length}곳 표시)`)
})

/* 3-2. watchEffect - 검색어(searchQuery)를 타이핑할 때마다 추적 */
watchEffect(() => {
  console.log(`🔍 [검색어 추적] 현재 검색어: "${searchQuery.value}"`)
})

/* 5. 본인 추가: 반응형 상태 + computed + watcher */
const clickCount = ref(0) // (추가 상태) 카드 클릭 누적 횟수

const averageTemp = computed(() => {
  // (추가 computed) 전체 평균 기온
  const sum = weatherList.value.reduce((acc, c) => acc + c.temp, 0)
  return (sum / weatherList.value.length).toFixed(1)
})

watch(clickCount, (count) => {
  // (추가 watcher) 클릭 횟수가 바뀔 때마다 로그
  console.log(`🖱️ [클릭 횟수] 총 ${count}번 클릭됨`)
})

/* 유틸/이벤트 */
const statusIcon = (status) => {
  const map = { 맑음: '☀️', 비: '🌧️', 구름: '☁️', 바람: '💨', 눈: '❄️' }
  return map[status] ?? '🌡️'
}
const selectCity = (name) => {
  selectedCityInfo.value = `${name}이 선택되었습니다.`
  clickCount.value++
}
const showDetail = (name, status) => {
  window.alert(`${name}의 현재 날씨는 [${status}] 상태입니다.`)
}
</script>

<template>
  <div class="dashboard-wrapper">
    <!-- 검색 -->
    <section class="search-box">
      <h3>🔍 도시 검색</h3>
      <input type="text" :value="searchQuery" @input="(e) => (searchQuery = e.target.value)" placeholder="검색할 도시 이름 입력" />
      <div class="temp-filter">
        <span>최소 기온:</span>
        <input type="number" v-model.number="minTemp" /> °C 이상
      </div>
      <p>
        검색 중인 도시: <strong>{{ searchQuery || '없음' }}</strong>
      </p>
    </section>

    <!-- 5. 추가 정보 패널 (computed 값 표시) -->
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

    <!-- 목록 -->
    <section class="list-box">
      <h3>🏙️ 지역별 날씨 현황</h3>

      <!-- 4. 검색 결과 없을 때 안내 -->
      <div v-if="filteredWeatherList.length === 0" class="empty">🔍 검색 결과와 일치하는 도시가 없습니다.</div>

      <!-- 4. 결과 있으면 카드 출력 (검색어 비면 computed가 전체 반환) -->
      <div v-else class="card-grid">
        <div
          v-for="item in filteredWeatherList"
          :key="item.id"
          class="weather-card"
          :class="item.temp >= 25 ? 'card-hot' : 'card-cool'"
          @click="selectCity(item.name)"
        >
          <div class="card-top">
            <h4>
              {{ item.name }} <span class="sub">{{ item.status }}</span>
            </h4>
            <span class="w-icon">{{ statusIcon(item.status) }}</span>
          </div>
          <p class="temp-big">{{ item.temp }}°</p>

          <span v-if="item.temp >= 25" class="badge hot">🔥 더움 (25도 이상)</span>
          <span v-else class="badge cool">❄️ 선선함 (25도 미만)</span>

          <button class="btn-detail" @click.stop="showDetail(item.name, item.status)">상세보기</button>
        </div>
      </div>
    </section>

    <div class="status-bar">{{ selectedCityInfo }}</div>
  </div>
</template>

<style scoped>
.dashboard-wrapper {
  max-width: 820px;
  margin: 0 auto;
  font-family:
    'Pretendard',
    -apple-system,
    sans-serif;
  color: #333;
}
.search-box,
.info-box {
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
}
.search-box h3 {
  margin: 0 0 12px;
  font-size: 15px;
  color: #4b5563;
}
.search-box input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}
.search-box input:focus {
  border-color: #42b883;
}
.search-box p {
  margin: 10px 0 0;
  font-size: 13px;
  color: #6b7280;
}
.info-box {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
  font-size: 14px;
  color: #4b5563;
}
.list-box h3 {
  font-size: 15px;
  color: #4b5563;
  margin-bottom: 12px;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}
.weather-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  position: static;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}
.weather-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}
.card-hot {
  border-top: 4px solid #ef4444;
  background: linear-gradient(180deg, #fff7f7, #fff);
}
.card-cool {
  border-top: 4px solid #3b82f6;
  background: linear-gradient(180deg, #f5f9ff, #fff);
}
.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-top h4 {
  margin: 0;
  font-size: 16px;
}
.sub {
  font-weight: normal;
  color: #9ca3af;
  font-size: 13px;
}
.w-icon {
  font-size: 34px;
  line-height: 1;
}
.temp-big {
  margin: 6px 0 12px;
  font-size: 38px;
  font-weight: 800;
  color: #1f2937;
}
.badge {
  display: inline-block;
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 12px;
}
.badge.hot {
  background: #fee2e2;
  color: #dc2626;
}
.badge.cool {
  background: #dbeafe;
  color: #2563eb;
}
.btn-detail {
  margin-top: auto;
  width: 100%;
  position: static;
  padding: 8px 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  color: #4b5563;
}
.btn-detail:hover {
  background: #f3f4f6;
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
.temp-filter {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  font-size: 14px;
  color: #4b5563;
}
.temp-filter input {
  width: 70px;
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
}
</style>
