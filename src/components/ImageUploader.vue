<template>
  <div class="mb-4">
    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{{ label }}</label>
    <div v-if="modelValue" class="relative inline-block max-w-[200px]">
      <img :src="modelValue" :alt="label" class="w-full rounded-lg border border-gray-200 dark:border-gray-700" />
      <UButton
        class="absolute top-1 right-1"
        color="error"
        variant="solid"
        size="xs"
        icon="i-lucide-x"
        @click="$emit('update:modelValue', '')"
      />
    </div>
    <div
      v-else
      class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 sm:p-6 text-center hover:border-primary-500 transition-colors cursor-pointer"
      @dragover.prevent
      @drop.prevent="onDrop"
      @click="$refs.input.click()"
    >
      <input
        ref="input"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileChange"
      />
      <UIcon name="i-lucide-image-plus" class="text-2xl text-gray-400 mb-2" />
      <p class="text-sm text-gray-500">Glisser ou cliquer pour choisir</p>
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
