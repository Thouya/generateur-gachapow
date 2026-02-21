<template>
  <div class="card-type-editor">
    <h3>{{ isEditing ? 'Modifier le type' : 'Nouveau type de carte' }}</h3>

    <div class="form-group">
      <label>Nom du type</label>
      <input v-model="form.name" type="text" placeholder="Ex: Monstre, Sort, Objet..." />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label>Largeur (px)</label>
        <input v-model.number="form.width" type="number" min="100" max="1000" />
      </div>
      <div class="form-group">
        <label>Hauteur (px)</label>
        <input v-model.number="form.height" type="number" min="100" max="1400" />
      </div>
    </div>

    <ImageUploader
      label="Fond de carte (couche 1)"
      v-model="form.backgroundImage"
    />

    <ImageUploader
      label="Illustration par défaut (couche 2)"
      v-model="form.illustrationImage"
    />

    <div class="form-group">
      <label>Colonne CSV pour illustration (optionnel)</label>
      <select v-model="form.illustrationColumn">
        <option value="">-- Aucune --</option>
        <option v-for="col in csvColumns" :key="col" :value="col">{{ col }}</option>
      </select>
      <small>Si défini, l'illustration sera prise depuis cette colonne du CSV (URL ou base64)</small>
    </div>

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

    <div class="form-actions">
      <button class="btn btn--primary" @click="save" :disabled="!form.name">
        {{ isEditing ? 'Mettre à jour' : 'Créer le type' }}
      </button>
      <button v-if="isEditing" class="btn" @click="$emit('cancel')">Annuler</button>
    </div>
  </div>
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

<style scoped>
.card-type-editor {
  background: #fafafa;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 0.75rem;
}

.form-group label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.form-group input[type='text'],
.form-group input[type='number'],
.form-group select {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.9rem;
}

.form-group input[type='color'] {
  width: 50px;
  height: 30px;
  padding: 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.form-group small {
  color: #888;
  font-size: 0.8rem;
}

.form-row {
  display: flex;
  gap: 1rem;
}

.form-row .form-group {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}
</style>
