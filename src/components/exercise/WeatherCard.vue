<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore.js'

const props = defineProps({
  city: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['select-card', 'click-detail'])

const configStore = useConfigStore()

const displayTemp = computed(() => {
  const rawTemp = props.city.temp // 원본은 섭씨
  if (configStore.unit === 'fahrenheit') {
    return Math.round((rawTemp * 9) / 5 + 32) // 화씨 변환
  }
  return rawTemp // 섭씨는 원본 그대로
})

const statusIcon = (status) => {
  const map = { 맑음: '☀️', 비: '🌧️', 구름: '☁️', 바람: '💨', 눈: '❄️' }
  return map[status] ?? '🌡️'
}
const isRainy = (status) => status === '비' || status === '눈'
</script>

<template>
  <div class="wc-card" :class="isRainy(city.status) ? 'wc-rain' : city.temp >= 25 ? 'wc-hot' : 'wc-cool'" @click="emit('select-card', city.name)">
    <div class="wc-top">
      <h4>
        {{ city.name }} <span class="wc-sub">{{ city.status }}</span>
      </h4>
      <span class="wc-icon">{{ statusIcon(city.status) }}</span>
    </div>
    <p class="wc-temp">{{ displayTemp }}{{ configStore.unitSymbol }}</p>

    <!-- 비/눈이면 우산 뱃지 우선, 아니면 온도 뱃지 -->
    <span v-if="isRainy(city.status)" class="wc-badge wc-badge-rain">☔ 우산 챙기세요</span>
    <span v-else-if="city.temp >= 25" class="wc-badge wc-badge-hot">🔥 더움 (25도 이상)</span>
    <span v-else class="wc-badge wc-badge-cool">❄️ 선선함 (25도 미만)</span>

    <button class="wc-detail" @click.stop="emit('click-detail', city)">상세보기</button>
  </div>
</template>

<style scoped>
.wc-card {
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  position: static;
  height: auto;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}
.wc-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
}
.wc-hot {
  border-top: 4px solid #ef4444;
  background: linear-gradient(180deg, #fff7f7, #fff);
}
.wc-cool {
  border-top: 4px solid #3b82f6;
  background: linear-gradient(180deg, #f5f9ff, #fff);
}

/* 강수(비/눈) 카드 — 빗줄기 애니메이션 */
.wc-rain {
  position: relative;
  overflow: hidden;
  border-top: 4px solid #0ea5e9;
  background: linear-gradient(180deg, #eaf4fb, #f7fcff);
}
.wc-rain::before {
  content: '';
  position: absolute;
  inset: -20% 0;
  pointer-events: none;
  z-index: 0;
  background-image: repeating-linear-gradient(
    110deg,
    rgba(56, 132, 200, 0.18) 0px,
    rgba(56, 132, 200, 0.18) 1.5px,
    transparent 1.5px,
    transparent 9px
  );
  background-size: 100% 60px;
  animation: wc-rain-fall 0.45s linear infinite;
}
@keyframes wc-rain-fall {
  from {
    background-position: 0 0;
  }
  to {
    background-position: -18px 60px;
  }
}
.wc-rain > * {
  position: relative;
  z-index: 1;
}
.wc-badge-rain {
  background: #e0f2fe;
  color: #0369a1;
}

.wc-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.wc-top h4 {
  margin: 0;
  font-size: 16px;
}
.wc-sub {
  font-weight: normal;
  color: #9ca3af;
  font-size: 13px;
}
.wc-icon {
  font-size: 34px;
  line-height: 1;
}
.wc-temp {
  margin: 6px 0 12px;
  font-size: 38px;
  font-weight: 800;
  color: #1f2937;
}

.wc-badge {
  display: inline-block;
  align-self: flex-start;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 12px;
}
.wc-badge-hot {
  background: #fee2e2;
  color: #dc2626;
}
.wc-badge-cool {
  background: #dbeafe;
  color: #2563eb;
}

.wc-detail {
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
.wc-detail:hover {
  background: #f3f4f6;
}
</style>
