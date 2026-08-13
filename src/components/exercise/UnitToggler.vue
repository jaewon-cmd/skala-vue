<script setup>
import { computed } from 'vue'
import { useConfigStore } from '@/stores/configStore.js'

const configStore = useConfigStore()

// 스위치 on = 화씨, off = 섭씨
const isFahrenheit = computed({
  get() {
    return configStore.unit === 'fahrenheit'
  },
  set() {
    configStore.toggleUnit()
  },
})
</script>

<template>
  <div class="unit-toggler">
    <span class="unit-label">날씨단위: {{ configStore.unitSymbol }}</span>
    <el-switch v-model="isFahrenheit" inline-prompt active-text="°F" inactive-text="°C" />
  </div>
</template>

<style scoped>
.unit-toggler {
  display: flex;
  align-items: center;
  gap: 8px;
}
.unit-label {
  font-size: 14px;
  color: #4b5563;
}
</style>
