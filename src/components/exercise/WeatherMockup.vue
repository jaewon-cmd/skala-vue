<script setup>
import { ref } from 'vue'

// 가상의 백엔드 데이터 배열 (v-for 및 :key 실습용)
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

// 검색어 및 상태바 메시지
const searchQuery = ref('')
const selectedCityInfo = ref('카드를 클릭하거나 검색해 보세요.')

// 상세보기 알림창
const showDetail = (cityName, status) => {
  window.alert(`${cityName}의 현재 날씨는 [${status}] 상태입니다.`)
}

// 날씨 상태 → 이모지 아이콘
const statusIcon = (status) => {
  const map = { 맑음: '☀️', 비: '🌧️', 구름: '☁️', 바람: '💨', 눈: '❄️' }
  return map[status] ?? '🌡️' // 없는 상태면 기본 아이콘
}
</script>

<template>
  <div class="dashboard-wrapper">
    <section class="search-box">
      <h3>🔍 도시 검색</h3>
      <!-- :value + @input : v-model을 풀어 쓴 양방향 바인딩 -->
      <input
        type="text"
        :value="searchQuery"
        @input="(e) => (searchQuery = e.target.value)"
        placeholder="검색할 도시 이름 입력"
      />
      <p>
        검색 중인 도시: <strong>{{ searchQuery || '없음' }}</strong>
      </p>
    </section>

    <section class="list-box">
      <h3>🏙️ 지역별 날씨 현황</h3>
      <div class="card-grid">
        <!-- v-for로 전체 목록 반복 (필터링 없음 — 과제 1) -->
        <div
          v-for="item in weatherList"
          :key="item.id"
          class="weather-card"
          :class="item.temp >= 25 ? 'card-hot' : 'card-cool'"
          @click="selectedCityInfo = `${item.name}이 선택되었습니다.`"
        >
          <div class="card-top">
            <h4>
              {{ item.name }} <span class="sub">{{ item.status }}</span>
            </h4>
            <span class="w-icon">{{ statusIcon(item.status) }}</span>
          </div>
          <p>현재 기온: {{ item.temp }}°C</p>

          <!-- 기온 25도 기준 라벨 분기 -->
          <span v-if="item.temp >= 25" class="badge hot">🔥 더움 (25도 이상)</span>
          <span v-else class="badge cool">❄️ 선선함 (25도 미만)</span>

          <!-- .stop : 카드 클릭 버블링 차단 -->
          <button class="btn-detail" @click.stop="showDetail(item.name, item.status)">
            상세보기
          </button>
        </div>
      </div>
    </section>

    <div class="status-bar">
      {{ selectedCityInfo }}
    </div>
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

/* 검색 박스 */
.search-box {
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

/* 목록 제목 */
.list-box h3 {
  font-size: 15px;
  color: #4b5563;
  margin-bottom: 12px;
}

/* 카드 그리드 (한 줄에 3개) */
.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

/* 날씨 카드 */
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
.weather-card h4 {
  margin: 0 0 6px;
  font-size: 16px;
}
.weather-card p {
  margin: 0 0 10px;
  font-size: 14px;
  color: #4b5563;
}
/* 온도별 카드 색상 (:class로 자동 적용) */
.card-hot {
  border-top: 4px solid #ef4444; /* 더움 = 빨강 */
  background: linear-gradient(180deg, #fff7f7, #fff);
}
.card-cool {
  border-top: 4px solid #3b82f6; /* 선선함 = 파랑 */
  background: linear-gradient(180deg, #f5f9ff, #fff);
}

/* 뱃지 */
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

/* 상세보기 버튼 */
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

/* 하단 상태바 */
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

/* 상단: 도시명과 아이콘을 양옆으로 */
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

/* 큰 날씨 아이콘 */
.w-icon {
  font-size: 34px;
  line-height: 1;
}

/* 큰 기온 강조 */
.temp-big {
  margin: 6px 0 12px;
  font-size: 38px;
  font-weight: 800;
  color: #1f2937;
}
</style>
