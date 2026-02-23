<template>
  <div class="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-sm">
    <div class="px-4 py-3 border-b border-[var(--ui-border)]">
      <h3 class="text-lg font-semibold">{{ isEditing ? 'Modifier le type' : 'Nouveau type de carte' }}</h3>
    </div>

    <div class="p-4 space-y-4">
      <UFormField label="Nom du type">
        <UInput v-model="form.name" placeholder="Ex: Monstre, Sort, Objet..." icon="i-lucide-tag" />
      </UFormField>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <UFormField label="Largeur (px)">
          <UInput v-model.number="form.width" type="number" :min="100" :max="1000" />
        </UFormField>
        <UFormField label="Hauteur (px)">
          <UInput v-model.number="form.height" type="number" :min="100" :max="1400" />
        </UFormField>
      </div>

      <ImageUploader
        label="Fond de carte (couche 1)"
        :model-value="form.backgroundImage"
        @update:model-value="form.backgroundImage = $event"
      />

      <ImageUploader
        label="Illustration par défaut (couche 2)"
        :model-value="form.illustrationImage"
        @update:model-value="form.illustrationImage = $event"
      />

      <UFormField label="Colonne CSV pour illustration (optionnel)" hint="Si défini, l'illustration sera prise depuis cette colonne du CSV (URL ou base64)">
        <USelect
          v-model="form.illustrationColumn"
          :items="illustrationColumnOptions"
          value-key="value"
        />
      </UFormField>

      <ImageUploader
        label="Dessus de carte (couche 3)"
        :model-value="form.overlayImage"
        @update:model-value="form.overlayImage = $event"
      />

      <!-- Mapping visuel des zones de contenu -->
      <FieldMapper
        :fields="form.contentFields"
        :card-type="form"
        :csv-columns="csvColumns"
        :preview-data="previewData"
        @update:fields="form.contentFields = $event"
      />
    </div>

    <div class="px-4 py-3 border-t border-[var(--ui-border)] flex gap-3">
      <UButton color="primary" icon="i-lucide-save" :disabled="!form.name" @click="save">
        {{ isEditing ? 'Mettre à jour' : 'Créer le type' }}
      </UButton>
      <UButton v-if="isEditing" variant="soft" @click="$emit('cancel')">Annuler</UButton>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed } from 'vue'
import ImageUploader from './ImageUploader.vue'
import FieldMapper from './FieldMapper.vue'
import { useCardsStore } from '../stores/cards.js'

const props = defineProps({
  editingType: { type: Object, default: null },
})

const emit = defineEmits(['saved', 'cancel'])
const store = useCardsStore()

const isEditing = ref(false)

const NONE_VALUE = '__none__'

const form = reactive({
  name: '',
  width: 300,
  height: 420,
  backgroundImage: '',
  illustrationImage: '',
  illustrationColumn: NONE_VALUE,
  overlayImage: '',
  contentFields: [],
})

function resetForm(source = {}) {
  form.name = source.name ?? ''
  form.width = source.width ?? 300
  form.height = source.height ?? 420
  form.backgroundImage = source.backgroundImage ?? ''
  form.illustrationImage = source.illustrationImage ?? ''
  form.illustrationColumn = source.illustrationColumn || NONE_VALUE
  form.overlayImage = source.overlayImage ?? ''
  form.contentFields = source.contentFields ? source.contentFields.map((f) => ({ ...f })) : []
}

const csvColumns = computed(() => store.csvColumns)

const illustrationColumnOptions = computed(() => [
  { label: '-- Aucune --', value: NONE_VALUE },
  ...store.csvColumns.map((col) => ({ label: col, value: col })),
])

const previewData = computed(() => {
  if (store.csvData.length > 0) return store.csvData[0]
  return {}
})

watch(
  () => props.editingType,
  (type) => {
    if (type) {
      isEditing.value = true
      resetForm(type)
    } else {
      isEditing.value = false
      resetForm()
    }
  },
  { immediate: true }
)

function save() {
  const data = {
    name: form.name,
    width: form.width,
    height: form.height,
    backgroundImage: form.backgroundImage,
    illustrationImage: form.illustrationImage,
    illustrationColumn: form.illustrationColumn === NONE_VALUE ? '' : form.illustrationColumn,
    overlayImage: form.overlayImage,
    contentFields: form.contentFields.map((f) => ({ ...f })),
  }

  if (isEditing.value && props.editingType) {
    store.updateCardType(props.editingType.id, data)
  } else {
    const id = store.addCardType(data)
    store.selectCardType(id)
  }

  resetForm()
  isEditing.value = false
  emit('saved')
}
</script>
