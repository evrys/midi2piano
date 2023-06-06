<script setup lang="ts">
import { defineState } from 'vue-define-state'

const state = defineState({
  input: '',

  get output() {
    return this.input
  }
});

function onFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    state.input = reader.result as string;
  };
  reader.readAsText(file);
}
</script>

<template>
  <main>
    <div class="container">
      <h1>SS13 midi2piano</h1>
      <input type="file" @change="onFileUpload"/>
      <div class="output">
        {{ state.output }}
      </div>
    </div>
  </main>
</template>

<style scoped>
  main {
    padding-top: 10rem;
  }
</style>
