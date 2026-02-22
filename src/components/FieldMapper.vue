<template>
  <div class="mt-4">
    <h4 class="text-base font-semibold mb-1">Placement des zones de contenu</h4>
    <p class="text-sm text-gray-500 mb-4">
      Glisse les zones directement sur la carte pour les positionner. Clique sur une zone pour la configurer.
    </p>

    <div class="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start mb-4">
      <!-- Carte de prévisualisation interactive -->
      <div class="w-full lg:w-auto overflow-x-auto">
      <div
        ref="cardRef"
        class="field-mapper__card"
        :style="cardStyle"
      >
        <!-- Couches de fond -->
        <img v-if="cardType.backgroundImage" :src="cardType.backgroundImage" class="card-layer card-layer--bg" />
        <img v-if="cardType.illustrationImage" :src="cardType.illustrationImage" class="card-layer card-layer--illus" />
        <img v-if="cardType.overlayImage" :src="cardType.overlayImage" class="card-layer card-layer--overlay" />

        <!-- Zones de contenu draggables -->
        <div
          v-for="(field, i) in fields"
          :key="i"
          class="field-zone"
          :class="{ 'field-zone--active': selectedFieldIndex === i }"
          :style="fieldZoneStyle(field)"
          @mousedown.prevent="startDrag(i, $event)"
          @click.stop="selectField(i)"
        >
          <span class="field-zone__label">{{ field.label || field.key || `Zone ${i + 1}` }}</span>
          <div
            class="field-zone__resize"
            @mousedown.prevent.stop="startResize(i, $event)"
          ></div>
        </div>
      </div>
      </div>

      <!-- Panneau de configuration du champ sélectionné -->
      <UCard v-if="selectedField" class="w-full lg:flex-1 lg:min-w-[220px] max-h-[480px] overflow-y-auto">
        <template #header>
          <div class="flex justify-between items-center">
            <strong>{{ selectedField.label || selectedField.key || `Zone ${selectedFieldIndex + 1}` }}</strong>
            <UButton size="xs" color="error" variant="soft" icon="i-lucide-trash-2" @click="removeField(selectedFieldIndex)" />
          </div>
        </template>

        <div class="space-y-3">
          <UFormField label="Label (affiché en édition)">
            <UInput v-model="selectedField.label" placeholder="Ex: Nom, ATQ, PV..." size="sm" />
          </UFormField>

          <UFormField label="Colonne CSV">
            <USelect
              v-model="selectedField.key"
              :items="csvColumnOptions"
              value-key="value"
              size="sm"
            />
          </UFormField>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <UFormField label="X">
              <UInput v-model.number="selectedField.x" type="number" size="sm" />
            </UFormField>
            <UFormField label="Y">
              <UInput v-model.number="selectedField.y" type="number" size="sm" />
            </UFormField>
            <UFormField label="Largeur">
              <UInput v-model.number="selectedField.width" type="number" size="sm" />
            </UFormField>
            <UFormField label="Hauteur">
              <UInput v-model.number="selectedField.height" type="number" size="sm" />
            </UFormField>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <UFormField label="Police">
              <USelect
                v-model="selectedField.fontFamily"
                :items="fontOptions"
                value-key="value"
                size="sm"
              />
            </UFormField>
            <UFormField label="Taille">
              <UInput v-model.number="selectedField.fontSize" type="number" :min="6" :max="120" size="sm" />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <UFormField label="Couleur">
              <input v-model="selectedField.color" type="color" class="w-10 h-8 rounded border border-gray-300 dark:border-gray-600 cursor-pointer" />
            </UFormField>
            <UFormField label="Alignement">
              <USelect
                v-model="selectedField.align"
                :items="alignOptions"
                value-key="value"
                size="sm"
              />
            </UFormField>
            <UFormField label="Vertical">
              <USelect
                v-model="selectedField.verticalAlign"
                :items="verticalAlignOptions"
                value-key="value"
                size="sm"
              />
            </UFormField>
          </div>

          <div class="flex gap-4">
            <UCheckbox v-model="selectedField.bold" label="Gras" />
            <UCheckbox v-model="selectedField.italic" label="Italique" />
            <UCheckbox v-model="selectedField.uppercase" label="MAJUSCULES" />
          </div>

          <!-- Aperçu du rendu du champ -->
          <div class="mt-3 p-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded min-h-8" :style="fieldPreviewStyle">
            {{ previewText }}
          </div>
        </div>
      </UCard>
    </div>

    <!-- Liste des champs + ajout -->
    <div class="flex flex-wrap gap-2 items-center">
      <UBadge
        v-for="(field, i) in fields"
        :key="i"
        :color="selectedFieldIndex === i ? 'warning' : 'primary'"
        variant="subtle"
        class="cursor-pointer"
        @click="selectField(i)"
      >
        {{ field.label || field.key || `Zone ${i + 1}` }}
      </UBadge>
      <UButton size="xs" variant="soft" icon="i-lucide-plus" @click="addField">Ajouter une zone</UButton>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  fields: { type: Array, required: true },
  cardType: { type: Object, required: true },
  csvColumns: { type: Array, default: () => [] },
  previewData: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['update:fields'])

const AVAILABLE_FONTS = [
  { label: 'System (par défaut)', value: 'system-ui, sans-serif' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Times New Roman', value: '"Times New Roman", serif' },
  { label: 'Courier New', value: '"Courier New", monospace' },
  { label: 'Impact', value: 'Impact, sans-serif' },
  { label: 'Comic Sans MS', value: '"Comic Sans MS", cursive' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Verdana', value: 'Verdana, sans-serif' },
  { label: 'Palatino', value: '"Palatino Linotype", serif' },
  { label: 'Garamond', value: 'Garamond, serif' },
  { label: 'Lucida Console', value: '"Lucida Console", monospace' },
]

const fontOptions = AVAILABLE_FONTS

const csvColumnOptions = computed(() => [
  { label: '-- Choisir --', value: '' },
  ...props.csvColumns.map((col) => ({ label: col, value: col })),
])

const alignOptions = [
  { label: 'Gauche', value: 'left' },
  { label: 'Centre', value: 'center' },
  { label: 'Droite', value: 'right' },
]

const verticalAlignOptions = [
  { label: 'Haut', value: 'top' },
  { label: 'Milieu', value: 'middle' },
  { label: 'Bas', value: 'bottom' },
]

const cardRef = ref(null)
const selectedFieldIndex = ref(null)
const dragging = ref(null)
const resizing = ref(null)

const selectedField = computed(() =>
  selectedFieldIndex.value !== null ? props.fields[selectedFieldIndex.value] : null
)

const cardStyle = computed(() => ({
  width: (props.cardType.width || 300) + 'px',
  height: (props.cardType.height || 420) + 'px',
}))

const previewText = computed(() => {
  if (!selectedField.value) return ''
  const key = selectedField.value.key
  if (key && props.previewData[key]) return props.previewData[key]
  return selectedField.value.label || 'Texte exemple'
})

const fieldPreviewStyle = computed(() => {
  if (!selectedField.value) return {}
  const f = selectedField.value
  return {
    fontFamily: f.fontFamily || 'system-ui, sans-serif',
    fontSize: (f.fontSize || 14) + 'px',
    color: f.color || '#000',
    fontWeight: f.bold ? 'bold' : 'normal',
    fontStyle: f.italic ? 'italic' : 'normal',
    textTransform: f.uppercase ? 'uppercase' : 'none',
    textAlign: f.align || 'left',
  }
})

function fieldZoneStyle(field) {
  return {
    left: (field.x ?? 0) + 'px',
    top: (field.y ?? 0) + 'px',
    width: (field.width || 80) + 'px',
    height: (field.height || 30) + 'px',
    fontSize: (field.fontSize ?? 14) + 'px',
    fontFamily: field.fontFamily || 'system-ui, sans-serif',
  }
}

function selectField(index) {
  selectedFieldIndex.value = index
}

function addField() {
  const newField = {
    key: '',
    label: '',
    x: 20,
    y: 20 + props.fields.length * 40,
    width: 120,
    height: 30,
    fontSize: 14,
    fontFamily: 'system-ui, sans-serif',
    color: '#000000',
    bold: false,
    italic: false,
    uppercase: false,
    align: 'left',
    verticalAlign: 'top',
  }
  const updated = [...props.fields, newField]
  emit('update:fields', updated)
  selectedFieldIndex.value = updated.length - 1
}

function removeField(index) {
  const updated = props.fields.filter((_, i) => i !== index)
  emit('update:fields', updated)
  selectedFieldIndex.value = null
}

// --- Drag logic ---
function startDrag(index, event) {
  selectedFieldIndex.value = index
  const field = props.fields[index]
  const startX = event.clientX
  const startY = event.clientY
  const origX = field.x ?? 0
  const origY = field.y ?? 0

  dragging.value = { index, startX, startY, origX, origY }

  const onMove = (e) => {
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    const cardW = props.cardType.width || 300
    const cardH = props.cardType.height || 420
    props.fields[index].x = Math.max(0, Math.min(cardW - (field.width || 80), Math.round(origX + dx)))
    props.fields[index].y = Math.max(0, Math.min(cardH - (field.height || 30), Math.round(origY + dy)))
  }

  const onUp = () => {
    dragging.value = null
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function startResize(index, event) {
  const field = props.fields[index]
  const startX = event.clientX
  const startY = event.clientY
  const origW = field.width || 80
  const origH = field.height || 30

  resizing.value = { index }

  const onMove = (e) => {
    const dx = e.clientX - startX
    const dy = e.clientY - startY
    props.fields[index].width = Math.max(30, Math.round(origW + dx))
    props.fields[index].height = Math.max(16, Math.round(origH + dy))
  }

  const onUp = () => {
    resizing.value = null
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }

  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}
</script>

<style scoped>
.field-mapper__card {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  background: #e0e0e0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
  cursor: crosshair;
}

.card-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.card-layer--bg { z-index: 1; object-fit: cover; }
.card-layer--illus { z-index: 2; object-fit: contain; }
.card-layer--overlay { z-index: 3; object-fit: cover; }

.field-zone {
  position: absolute;
  z-index: 10;
  border: 2px dashed rgba(74, 144, 217, 0.7);
  background: rgba(74, 144, 217, 0.1);
  border-radius: 4px;
  cursor: move;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  overflow: hidden;
  transition: border-color 0.1s, background 0.1s;
}

.field-zone:hover {
  border-color: rgba(74, 144, 217, 1);
  background: rgba(74, 144, 217, 0.15);
}

.field-zone--active {
  border-color: #e85d04;
  background: rgba(232, 93, 4, 0.12);
  z-index: 11;
}

.field-zone__label {
  font-size: 10px;
  color: #fff;
  background: rgba(74, 144, 217, 0.85);
  padding: 1px 5px;
  border-radius: 2px;
  white-space: nowrap;
  pointer-events: none;
  line-height: 1.3;
}

.field-zone--active .field-zone__label {
  background: rgba(232, 93, 4, 0.85);
}

.field-zone__resize {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 12px;
  height: 12px;
  cursor: nwse-resize;
  background: linear-gradient(135deg, transparent 50%, rgba(74, 144, 217, 0.6) 50%);
  border-radius: 0 0 2px 0;
}

.field-zone--active .field-zone__resize {
  background: linear-gradient(135deg, transparent 50%, rgba(232, 93, 4, 0.6) 50%);
}
</style>
