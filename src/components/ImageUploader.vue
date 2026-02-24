<template>
  <div class="mb-4">
    <label class="block text-sm font-medium text-[var(--ui-text-muted)] mb-1">{{ label }}</label>

    <!-- Image affichée : valeur persistée OU aperçu local pendant l'upload -->
    <div v-if="modelValue || localPreview" class="relative inline-block max-w-[200px]">
      <img
        :src="localPreview || modelValue"
        :alt="label"
        class="w-full rounded-[var(--ui-radius)] border border-[var(--ui-border)]"
      />
      <!-- Overlay chargement -->
      <div
        v-if="uploading"
        class="absolute inset-0 bg-black/45 rounded-[var(--ui-radius)] flex items-center justify-center"
      >
        <UIcon name="i-lucide-loader-circle" class="text-white text-2xl animate-spin" />
      </div>
      <!-- Bouton supprimer (masqué pendant l'upload) -->
      <UButton
        v-if="!uploading"
        class="absolute top-1 right-1"
        color="error"
        variant="solid"
        size="xs"
        icon="i-lucide-x"
        @click="clear"
      />
    </div>

    <!-- Zone de drop (si aucune image et pas d'upload en cours) -->
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

const props = defineProps({
  label: { type: String, default: 'Image' },
  modelValue: { type: String, default: '' },
  /**
   * Fonction async optionnelle (file: File) => { url: string } | { error: string }
   * Si fournie, l'image est uploadée sur Supabase Storage et l'URL publique est émise.
   * Sinon, comportement legacy : base64 émis directement.
   */
  upload: { type: Function, default: null },
})

const emit = defineEmits(['update:modelValue'])

const input = ref(null)
const uploading = ref(false)
const localPreview = ref(null) // object URL pour affichage immédiat pendant l'upload

async function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) return

  if (props.upload) {
    // 1. Aperçu immédiat via Object URL
    const objectUrl = URL.createObjectURL(file)
    localPreview.value = objectUrl
    uploading.value = true

    const result = await props.upload(file).catch((err) => ({ error: String(err) }))
    uploading.value = false

    if (result?.url) {
      // Succès : émettre l'URL publique et libérer l'Object URL
      URL.revokeObjectURL(objectUrl)
      localPreview.value = null
      emit('update:modelValue', result.url)
    } else {
      // Échec : fallback en base64, garder l'aperçu jusqu'à ce que le reader soit prêt
      console.error('[ImageUploader] Upload Storage échoué :', result?.error)
      const reader = new FileReader()
      reader.onload = (e) => {
        URL.revokeObjectURL(objectUrl)
        localPreview.value = null
        emit('update:modelValue', e.target.result)
      }
      reader.readAsDataURL(file)
    }
  } else {
    readAsBase64(file)
  }
}

function readAsBase64(file) {
  const reader = new FileReader()
  reader.onload = (e) => emit('update:modelValue', e.target.result)
  reader.readAsDataURL(file)
}

function onFileChange(e) {
  handleFile(e.target.files[0])
  e.target.value = '' // permet de re-sélectionner le même fichier
}

function onDrop(e) {
  handleFile(e.dataTransfer.files[0])
}

function clear() {
  emit('update:modelValue', '')
  localPreview.value = null
}
</script>
