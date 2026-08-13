<script setup>
import { useRouter } from 'vue-router'
import { REGIONS } from '@/constants/regions.js'

const router = useRouter()

const goHome = () => router.push('/')

// 주요 기능
const features = [
  {
    icon: '🔍',
    title: '지역 검색',
    desc: `전국 ${REGIONS.length}개 주요 지역을 한글·영문·권역으로 검색합니다. 좌표를 미리 확정해 둬서 오타나 엉뚱한 결과 없이 즉시 반응합니다.`,
  },
  {
    icon: '🌡️',
    title: '현재 날씨',
    desc: '기온과 체감온도를 크게 보여주고, 일출·일몰 시각과 지금이 낮의 어디쯤인지도 함께 표시합니다.',
  },
  {
    icon: '🧭',
    title: '바람 · 습도 · 강수량 · 기온 범위',
    desc: '풍속과 풍향을 방위·각도로 나누어 보여주고, 돌풍과 시간당 강수량, 하루 일교차까지 한 줄에 모아 확인할 수 있습니다.',
  },
  {
    icon: '😷',
    title: '미세먼지',
    desc: '미세먼지(PM10)와 초미세먼지(PM2.5) 농도를 좋음~매우 나쁨 4단계 등급과 함께 표시합니다.',
  },
  {
    icon: '🕒',
    title: '시간별 · 주간 예보',
    desc: '3시간 단위 24시간 예보와 날짜별 최저·최고 기온을 제공합니다. 강수 확률도 함께 봅니다.',
  },
  {
    icon: '🗺️',
    title: '날씨 지도',
    desc: '강수·구름·기온을 지도 위에 겹쳐 봅니다. 색이 무엇을 뜻하는지 범례로 함께 설명합니다.',
  },
  {
    icon: '📊',
    title: '통계 · 날짜별 조회',
    desc: '주요 도시의 기온 분포를 한눈에 비교하고, 비교할 지역을 직접 골라 원하는 날짜와 시간의 날씨를 표로 조회합니다.',
  },
  {
    icon: '🎬',
    title: '날씨 배경',
    desc: 'Three.js로 현재 날씨에 맞는 하늘과 구름을 그리고, 비와 눈은 입자로 실제로 내립니다.',
  },
]

// 사용 기술
const stack = [
  { name: 'Vue 3', note: 'Composition API · <script setup>' },
  { name: 'Vue Router', note: '동적 라우팅 · 지연 로딩' },
  { name: 'Pinia', note: '전역 상태 · 조회 결과 캐시' },
  { name: 'Axios', note: 'API 통신 · 병렬 요청' },
  { name: 'Element Plus', note: 'UI 컴포넌트' },
  { name: 'Three.js', note: '날씨 배경 렌더링' },
  { name: 'Leaflet', note: '날씨 지도' },
]

// 데이터 출처
const sources = [
  { api: 'Current Weather', use: '현재 기온 · 체감 · 습도 · 바람 · 일출/일몰' },
  { api: '5 day / 3 hour Forecast', use: '시간별 예보 · 주간 최저/최고' },
  { api: 'Air Pollution', use: '미세먼지 PM10 · PM2.5' },
  { api: 'Weather Maps', use: '지도 위 강수 · 구름 · 기온 레이어' },
  { api: 'Geocoding', use: '지역 좌표 확정 (목록 구성 시 사용)' },
]
</script>

<template>
  <div class="about-wrap">
    <header class="about-head">
      <h2 class="about-title">ℹ️ 서비스 소개</h2>
      <p class="about-sub">SKALA 일기예보는 Vue 3로 만든 지역별 날씨 서비스입니다.</p>
    </header>

    <section class="about-intro glass-card">
      <p>
        전국 <strong>{{ REGIONS.length }}개 주요 지역</strong>의 현재 날씨와 미세먼지, 시간별·주간 예보를 한 화면에서 확인할 수 있습니다. 보고 싶은
        지역을 검색하면 그 지역의 하늘이 배경으로 그려집니다.
      </p>
    </section>

    <section class="about-section glass-card">
      <h3 class="about-section-title">주요 기능</h3>
      <div class="about-features">
        <article v-for="item in features" :key="item.title" class="about-feature">
          <span class="about-feature-icon">{{ item.icon }}</span>
          <div>
            <h4 class="about-feature-title">{{ item.title }}</h4>
            <p class="about-feature-desc">{{ item.desc }}</p>
          </div>
        </article>
      </div>
    </section>

    <section class="about-section glass-card">
      <h3 class="about-section-title">사용 기술</h3>
      <ul class="about-stack">
        <li v-for="tech in stack" :key="tech.name">
          <span class="about-stack-name">{{ tech.name }}</span>
          <span class="about-stack-note">{{ tech.note }}</span>
        </li>
      </ul>
    </section>

    <section class="about-section glass-card">
      <h3 class="about-section-title">데이터 출처</h3>
      <p class="about-source-lead">모든 기상 정보는 OpenWeather API에서 실시간으로 가져옵니다.</p>
      <ul class="about-sources">
        <li v-for="source in sources" :key="source.api">
          <el-tag size="small" effect="plain">{{ source.api }}</el-tag>
          <span class="about-source-use">{{ source.use }}</span>
        </li>
      </ul>
      <p class="about-note">
        미세먼지는 관측소 실측이 아닌 OpenWeather의 모델 예측값이라, 환경부 에어코리아 공식 수치와는 차이가 있을 수 있습니다. 지도 배경은
        OpenStreetMap과 CARTO의 타일을 사용합니다.
      </p>
    </section>

    <el-button type="primary" class="about-btn" @click="goHome"> 메인 대시보드로 돌아가기 </el-button>
  </div>
</template>

<style scoped>
.about-wrap {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 0;
}

/* 제목은 카드 밖 하늘 위에 놓이므로 흰 글씨로 대비를 준다 */
.about-head {
  margin: 0 0 0 4px;
}
.about-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
}
.about-sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.92);
  text-shadow: 0 1px 5px rgba(0, 0, 0, 0.3);
}

.about-intro {
  padding: 18px 20px;
  background: linear-gradient(160deg, #e8f2ff, #f6f9ff);
  border-radius: 14px;
  line-height: 1.7;
  color: #1f2d3d;
  font-size: 14px;
}
.about-intro p {
  margin: 0;
}

/* 간격은 부모의 flex gap이 담당한다 */
.about-section {
  margin: 0;
}
.about-section-title {
  margin: 0 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: #606266;
}

/* 주요 기능 */
.about-features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}
.about-feature {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #ebeef5;
  border-radius: 14px;
}
.about-feature-icon {
  font-size: 24px;
  line-height: 1.2;
}
.about-feature-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 700;
  color: #1f2d3d;
}
.about-feature-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #606266;
}

/* 사용 기술 */
.about-stack {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 8px;
}
.about-stack li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 12px 14px;
  background: #f5f7fa;
  border-radius: 10px;
}
.about-stack-name {
  font-size: 14px;
  font-weight: 700;
  color: #1f2d3d;
}
.about-stack-note {
  font-size: 12px;
  color: #909399;
}

/* 데이터 출처 */
.about-source-lead {
  margin: 0 0 10px;
  font-size: 13px;
  color: #606266;
}
.about-sources {
  list-style: none;
  margin: 0;
  padding: 0;
}
.about-sources li {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}
.about-sources li:last-child {
  border-bottom: none;
}
.about-source-use {
  font-size: 13px;
  color: #606266;
}
.about-note {
  margin: 12px 0 0;
  padding: 10px 12px;
  background: #fdf6ec;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.6;
  color: #b88230;
}

.about-btn {
  align-self: flex-start;
  margin: 0;
}
</style>
