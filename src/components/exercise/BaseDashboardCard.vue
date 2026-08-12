<script setup>
// 제목만 props로 받음 (내용은 slot으로 주입받음)
defineProps({
  title: String,
})
</script>

<template>
  <section class="dash-card">
    <h3>{{ title }}</h3>
    <!--  이 자리에 부모가 넣은 내용(SearchBar, 카드목록)이 들어옴 -->
    <slot></slot>
  </section>
</template>

<style scoped>
.dash-card {
  background: #f8f9fa;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 16px;
}
.dash-card h3 {
  margin: 0 0 12px;
  font-size: 15px;
  color: #4b5563;
}
</style>
