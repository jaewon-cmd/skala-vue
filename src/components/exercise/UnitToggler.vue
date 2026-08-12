<script setup>
import { useConfigStore } from '@/stores/configStore'
const configStore = useConfigStore()
</script>

<template>
  <div style="text-align: center; margin-left: auto; display: inline-flex; align-items: center; gap: 8px">
    <span
      >날씨단위: <strong>{{ configStore.unit === 'celsius' ? '섭씨(℃)' : '화씨(℉)' }}</strong></span
    >
    <button @click="configStore.toggleUnit" class="toggle-btn">단위변경</button>
  </div>
</template>

<style scoped>
.toggle-btn {
  padding: 6px 10px;
  background-color: #4b6584;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}
</style>

<!-- <style scoped>
.unit-toggler {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #4b5563;
}
.label {
  font-weight: 500;
}
.toggle-btn {
  padding: 6px 12px;
  border: 1px solid #0ea5e9;
  border-radius: 8px;
  background: #fff;
  color: #0369a1;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}
.toggle-btn:hover {
  background: #e0f2fe;
}
</style> -->
