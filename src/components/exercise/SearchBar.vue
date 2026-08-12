<script setup>
import { useConfigStore } from '@/stores/configStore.js'
const configStore = useConfigStore()

// 부모에게 받기 (props) — 표시만 함, 직접 수정 X
defineProps({
  searchQuery: String,
  minTemp: Number,
})

// 부모에게 보내기 (emit)
const emit = defineEmits(['update-query', 'update-min-temp'])

// 검색어 입력 → 부모에게 전달
const onSearchInput = (e) => {
  emit('update-query', e.target.value)
}
// 최소기온 입력 → 부모에게 전달 (숫자로 변환해서)
const onMinTempInput = (e) => {
  emit('update-min-temp', Number(e.target.value))
}
</script>

<template>
  <div class="search-bar">
    <!-- 검색어: 부모가 준 값 표시(:value) + 입력 시 부모에게 전달(emit) -->
    <input type="text" :value="searchQuery" @input="onSearchInput" placeholder="검색할 도시 이름 입력" />

    <!-- 최소기온 필터 -->
    <div class="temp-filter">
      <span>최소 기온:</span>
      <input type="number" :value="minTemp" @input="onMinTempInput" /> {{ configStore.unitSymbol }} 이상
    </div>

    <p>
      검색 중인 도시: <strong>{{ searchQuery || '없음' }}</strong>
    </p>
  </div>
</template>

<style scoped>
.search-bar input[type='text'] {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}
.search-bar input[type='text']:focus {
  border-color: #42b883;
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
.search-bar p {
  margin: 10px 0 0;
  font-size: 13px;
  color: #6b7280;
}
</style>
