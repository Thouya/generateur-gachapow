<template>
  <UCard>
    <template #header>
      <h3 class="text-lg font-semibold">{{ isEditing ? 'Modifier le type' : 'Nouveau type de carte' }}</h3>
    </template>

    <div class="space-y-4">
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
        v-model="form.backgroundImage"
      />

      <ImageUploader
        label="Illustration par défaut (couche 2)"
        v-model="form.illustrationImage"
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
        v-model="form.overlayImage"
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

    <template #footer>
      <div class="flex gap-3">
        <UButton color="primary" icon="i-lucide-save" :disabled="!form.name" @click="save">
          {{ isEditing ? 'Mettre à jour' : 'Créer le type' }}
        </UButton>
        <UButton v-if="isEditing" variant="soft" @click="$emit('cancel')">Annuler</UButton>
      </div>
    </template>
  </UCard>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import ImageUploader from './ImageUploader.vue'
import FieldMapper from './FieldMapper.vue'
import { useCardsStore } from '../stores/cards.js'

const props = defineProps({
  editingType: { type: Object, default: null },
})

const emit = defineEmits(['saved', 'cancel'])
const store = useCardsStore()

const isEditing = ref(false)

const defaultForm = () => ({
  name: '',
  width: 300,
  height: 420,
  backgroundImage: '',
  illustrationImage: '',
  illustrationColumn: '',
  overlayImage: '',
  contentFields: [],
})

const form = ref(defaultForm())

const csvColumns = computed(() => store.csvColumns)

const illustrationColumnOptions = computed(() => [
  { label: '-- Aucune --', value: '' },
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
      form.value = {
        ...defaultForm(),
        ...type,
        contentFields: type.contentFields ? type.contentFields.map((f) => ({ ...f })) : [],
      }
    } else {
      isEditing.value = false
      form.value = defaultForm()
    }
  },
  { immediate: true }
)

function save() {
  const data = {
    name: form.value.name,
    width: form.value.width,
    height: form.value.height,
    backgroundImage: form.value.backgroundImage,
    illustrationImage: form.value.illustrationImage,
    illustrationColumn: form.value.illustrationColumn,
    overlayImage: form.value.overlayImage,
    contentFields: form.value.contentFields.map((f) => ({ ...f })),
  }

  if (isEditing.value && props.editingType) {
    store.updateCardType(props.editingType.id, data)
  } else {
    const id = store.addCardType(data)
    store.selectCardType(id)
  }

  form.value = defaultForm()
  isEditing.value = false
  emit('saved')
}
</script>
