<template>
  <div class="image-uploader">
    <label class="image-uploader__label">{{ label }}</label>
    <div class="image-uploader__preview" v-if="modelValue">
      <img :src="modelValue" :alt="label" />
      <button class="image-uploader__remove" @click="$emit('update:modelValue', '')" title="Supprimer">&times;</button>
    </div>
    <div v-else class="image-uploader__drop" @dragover.prevent @drop.prevent="onDrop">
      <input
        ref="input"
        type="file"
        accept="image/*"
        class="image-uploader__input"
        @change="onFileChange"
      />
      <button class="link-btn" @click="$refs.input.click()">Choisir une image</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  label: { type: String, default: 'Image' },
  modelValue: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])
const input = ref(null)

function readFile(file) {
  if (!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = (e) => {
    emit('update:modelValue', e.target.result)
  }
  reader.readAsDataURL(file)
}

function onFileChange(e) {
  readFile(e.target.files[0])
}

function onDrop(e) {
  readFile(e.dataTransfer.files[0])
}
</script>

<style scoped>
.image-uploader {
  margin-bottom: 1rem;
}

.image-uploader__label {
  display: block;
  font-weight: 600;
  margin-bottom: 0.35rem;
  font-size: 0.9rem;
}

.image-uploader__preview {
  position: relative;
  display: inline-block;
  max-width: 200px;
}

.image-uploader__preview img {
  width: 100%;
  border-radius: 6px;
  border: 1px solid #ddd;
}

.image-uploader__remove {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-uploader__drop {
  border: 2px dashed #aaa;
  border-radius: 6px;
  padding: 1rem;
  text-align: center;
}

.image-uploader__input {
  display: none;
}

.link-btn {
  background: none;
  border: none;
  color: #4a90d9;
  cursor: pointer;
  text-decoration: underline;
  font-size: inherit;
}
</style>
