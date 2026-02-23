<template>
  <div class="mb-4">
    <label class="block text-sm font-medium text-[var(--ui-text-muted)] mb-1">{{ label }}</label>
    <div v-if="modelValue" class="relative inline-block max-w-[200px]">
      <img :src="modelValue" :alt="label" class="w-full rounded-[var(--ui-radius)] border border-[var(--ui-border)]" />
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
      class="border-2 border-dashed border-[var(--ui-border)] rounded-[var(--ui-radius)] p-4 sm:p-6 text-center hover:border-[var(--ui-primary)] transition-colors cursor-pointer"
      @dragover.prevent
      @drop.prevent="onDrop"
      @click="$refs.input.click()"
    >
      <input
        ref="input"
        type="file"
        accept="image/*"
        class="absolute inset-0 opacity-0 w-0 h-0 pointer-events-none"
        tabindex="-1"
        @change="onFileChange"
      />
      <UIcon name="i-lucide-image-plus" class="text-2xl text-[var(--ui-text-dimmed)] mb-2" />
      <p class="text-sm text-[var(--ui-text-muted)]">Glisser ou cliquer pour choisir</p>
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
