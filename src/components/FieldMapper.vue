<template>
  <div class="field-mapper">
    <h4>Placement des zones de contenu</h4>
    <p class="field-mapper__hint">
      Glisse les zones directement sur la carte pour les positionner. Clique sur une zone pour la configurer.
    </p>

    <div class="field-mapper__workspace">
      <!-- Carte de prévisualisation interactive -->
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
          <!-- Poignée de resize -->
          <div
            class="field-zone__resize"
            @mousedown.prevent.stop="startResize(i, $event)"
          ></div>
        </div>
      </div>

      <!-- Panneau de configuration du champ sélectionné -->
      <div v-if="selectedField" class="field-config">
        <div class="field-config__header">
          <strong>{{ selectedField.label || selectedField.key || `Zone ${selectedFieldIndex + 1}` }}</strong>
          <button class="btn btn--small btn--danger" @click="removeField(selectedFieldIndex)">&times;</button>
        </div>

        <div class="field-config__form">
          <div class="fc-group">
            <label>Label (affiché en édition)</label>
            <input v-model="selectedField.label" type="text" placeholder="Ex: Nom, ATQ, PV..." />
          </div>

          <div class="fc-group">
            <label>Colonne CSV</label>
            <select v-model="selectedField.key">
              <option value="">-- Choisir --</option>
              <option v-for="col in csvColumns" :key="col" :value="col">{{ col }}</option>
            </select>
          </div>

          <div class="fc-row">
            <div class="fc-group">
              <label>X</label>
              <input v-model.number="selectedField.x" type="number" />
            </div>
            <div class="fc-group">
              <label>Y</label>
              <input v-model.number="selectedField.y" type="number" />
            </div>
            <div class="fc-group">
              <label>Largeur</label>
              <input v-model.number="selectedField.width" type="number" />
            </div>
            <div class="fc-group">
              <label>Hauteur</label>
              <input v-model.number="selectedField.height" type="number" />
            </div>
          </div>

          <div class="fc-row">
            <div class="fc-group fc-group--grow">
              <label>Police</label>
              <select v-model="selectedField.fontFamily">
                <option v-for="font in availableFonts" :key="font.value" :value="font.value">
                  {{ font.label }}
                </option>
              </select>
            </div>
            <div class="fc-group">
              <label>Taille</label>
              <input v-model.number="selectedField.fontSize" type="number" min="6" max="120" />
            </div>
          </div>

          <div class="fc-row">
            <div class="fc-group">
              <label>Couleur</label>
              <input v-model="selectedField.color" type="color" />
            </div>
            <div class="fc-group">
              <label>Alignement</label>
              <select v-model="selectedField.align">
                <option value="left">Gauche</option>
                <option value="center">Centre</option>
                <option value="right">Droite</option>
              </select>
            </div>
            <div class="fc-group">
              <label>Vertical</label>
              <select v-model="selectedField.verticalAlign">
                <option value="top">Haut</option>
                <option value="middle">Milieu</option>
                <option value="bottom">Bas</option>
              </select>
            </div>
          </div>

          <div class="fc-row">
            <label class="fc-checkbox">
              <input v-model="selectedField.bold" type="checkbox" /> Gras
            </label>
            <label class="fc-checkbox">
              <input v-model="selectedField.italic" type="checkbox" /> Italique
            </label>
            <label class="fc-checkbox">
              <input v-model="selectedField.uppercase" type="checkbox" /> MAJUSCULES
            </label>
          </div>

          <!-- Aperçu du rendu du champ -->
          <div class="fc-preview" :style="fieldPreviewStyle">
            {{ previewText }}
          </div>
        </div>
      </div>
    </div>

    <!-- Liste des champs + ajout -->
    <div class="field-mapper__list">
      <div
        v-for="(field, i) in fields"
        :key="i"
        class="field-tag"
        :class="{ 'field-tag--active': selectedFieldIndex === i }"
        @click="selectField(i)"
      >
        {{ field.label || field.key || `Zone ${i + 1}` }}
      </div>
      <button class="btn btn--secondary btn--small" @click="addField">+ Ajouter une zone</button>
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

const availableFonts = ref(AVAILABLE_FONTS)

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
.field-mapper {
  margin-top: 1rem;
}

.field-mapper__hint {
  font-size: 0.85rem;
  color: #666;
  margin-bottom: 1rem;
}

.field-mapper__workspace {
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
  margin-bottom: 1rem;
}

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

/* Config panel */
.field-config {
  flex: 1;
  min-width: 220px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 1rem;
  max-height: 480px;
  overflow-y: auto;
}

.field-config__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #eee;
}

.fc-group {
  margin-bottom: 0.5rem;
}

.fc-group--grow {
  flex: 1;
}

.fc-group label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #555;
  margin-bottom: 0.15rem;
}

.fc-group input[type='text'],
.fc-group input[type='number'],
.fc-group select {
  width: 100%;
  padding: 0.3rem 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 0.85rem;
}

.fc-group input[type='color'] {
  width: 40px;
  height: 28px;
  padding: 0;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
}

.fc-row {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
  margin-bottom: 0.5rem;
}

.fc-checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.85rem;
  cursor: pointer;
}

.fc-checkbox input {
  cursor: pointer;
}

.fc-preview {
  margin-top: 0.75rem;
  padding: 0.5rem;
  background: #f5f5f5;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  min-height: 2rem;
}

/* Field tags list */
.field-mapper__list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.field-tag {
  padding: 0.25rem 0.6rem;
  background: #e8f0fe;
  border: 1px solid #4a90d9;
  border-radius: 16px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.1s;
}

.field-tag:hover {
  background: #d0e3fc;
}

.field-tag--active {
  background: #e85d04;
  color: white;
  border-color: #e85d04;
}
</style>
