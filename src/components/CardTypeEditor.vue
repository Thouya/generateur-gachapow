<template>
  <div class="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg)] shadow-sm">
    <div class="px-4 py-3 border-b border-[var(--ui-border)]">
      <h3 class="text-lg font-semibold">{{ title }}</h3>
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

      <!-- Recadrage libre de l'illustration -->
      <div
        v-if="form.illustrationImage"
        class="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-3 space-y-3"
      >
        <div class="flex items-center justify-between">
          <span class="text-sm font-medium text-[var(--ui-text)]">Recadrage de l'illustration</span>
          <div class="flex items-center gap-1.5">
            <UButton
              v-if="!form.illustrationPosition"
              size="xs"
              variant="soft"
              icon="i-lucide-move"
              @click="enablePositioning"
            >Activer</UButton>
            <template v-else>
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-lucide-rotate-ccw"
                title="Réinitialiser"
                @click="resetIllustrationPosition"
              />
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-lucide-x"
                title="Désactiver le recadrage"
                @click="disablePositioning"
              />
            </template>
          </div>
        </div>

        <template v-if="form.illustrationPosition">
          <!-- Mini preview interactive (glisser pour déplacer) -->
          <div
            class="relative select-none rounded-lg overflow-hidden mx-auto"
            :class="isDragging ? 'cursor-grabbing' : 'cursor-grab'"
            :style="{ width: previewW + 'px', height: previewH + 'px', background: '#c8c8c8' }"
            @mousedown.prevent="startDrag"
            @touchstart.prevent="startDragTouch"
          >
            <!-- Fond -->
            <img
              v-if="form.backgroundImage"
              :src="form.backgroundImage"
              style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:1; pointer-events:none;"
              draggable="false"
              alt=""
            />
            <!-- Illustration positionnée -->
            <img
              v-if="form.illustrationImage"
              :src="form.illustrationImage"
              :style="illustrationEditorStyle"
              draggable="false"
              alt=""
            />
            <!-- Dessus -->
            <img
              v-if="form.overlayImage"
              :src="form.overlayImage"
              style="position:absolute; top:0; left:0; width:100%; height:100%; object-fit:cover; z-index:3; pointer-events:none;"
              draggable="false"
              alt=""
            />
            <!-- Viseur central -->
            <div style="position:absolute; inset:0; z-index:10; pointer-events:none; display:flex; align-items:center; justify-content:center; opacity:0.45;">
              <div style="position:absolute; width:18px; height:1px; background:white;"></div>
              <div style="position:absolute; width:1px; height:18px; background:white;"></div>
            </div>
            <!-- Hint -->
            <div style="position:absolute; bottom:4px; left:0; right:0; z-index:10; pointer-events:none; text-align:center; font-size:9px; color:rgba(255,255,255,0.7); letter-spacing:0.02em;">
              Glissez pour déplacer
            </div>
          </div>

          <!-- Slider zoom -->
          <div class="flex items-center gap-2">
            <UIcon name="i-lucide-zoom-out" class="w-4 h-4 shrink-0 text-[var(--ui-text-dimmed)]" />
            <input
              type="range"
              v-model.number="form.illustrationPosition.scale"
              min="0.3"
              max="5"
              step="0.05"
              class="flex-1 accent-[var(--ui-primary)] cursor-pointer"
              style="height:4px;"
            />
            <UIcon name="i-lucide-zoom-in" class="w-4 h-4 shrink-0 text-[var(--ui-text-dimmed)]" />
            <span class="text-xs text-[var(--ui-text-dimmed)] w-10 text-right tabular-nums">
              {{ Math.round((form.illustrationPosition.scale ?? 1) * 100) }}%
            </span>
          </div>
        </template>
      </div>

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
        {{ isEditing ? 'Enregistrer' : 'Créer le type' }}
      </UButton>
      <UButton v-if="isEditing && !tabMode" variant="soft" @click="$emit('cancel')">Annuler</UButton>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, watch, computed, onUnmounted } from 'vue'
import ImageUploader from './ImageUploader.vue'
import FieldMapper from './FieldMapper.vue'
import { useCardsStore } from '../stores/cards.js'

const props = defineProps({
  editingType: { type: Object, default: null },
  // tabMode = true : on édite store.selectedCardType directement, sans prop editingType
  tabMode: { type: Boolean, default: false },
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
  illustrationPosition: null, // null = mode héritage (contain), object = mode libre (cover + transform)
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
  form.illustrationPosition = source.illustrationPosition
    ? { ...source.illustrationPosition }
    : null
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

// Source of truth for the type being edited
const sourceType = computed(() => props.editingType ?? (props.tabMode ? store.selectedCardType : null))

const title = computed(() => {
  if (props.tabMode && store.selectedCardType) return `Options — ${store.selectedCardType.name}`
  if (isEditing.value) return 'Modifier le type'
  return 'Nouveau type de carte'
})

watch(
  sourceType,
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

// ── Recadrage illustration ───────────────────────────────────────────────────
// Dimensions de la mini-preview (ratio conservé, max 200px de large)
const previewW = computed(() => Math.min(form.width || 300, 200))
const previewH = computed(() => {
  const ratio = (form.height || 420) / (form.width || 300)
  return Math.round(previewW.value * ratio)
})
// Facteur de conversion preview ↔ carte
const previewScale = computed(() => previewW.value / (form.width || 300))

function enablePositioning() {
  form.illustrationPosition = { offsetX: 0, offsetY: 0, scale: 1 }
}
function disablePositioning() {
  form.illustrationPosition = null
}
function resetIllustrationPosition() {
  if (!form.illustrationPosition) return
  form.illustrationPosition.offsetX = 0
  form.illustrationPosition.offsetY = 0
  form.illustrationPosition.scale = 1
}

// Style appliqué à l'image dans la mini-preview
const illustrationEditorStyle = computed(() => {
  if (!form.illustrationPosition) return {}
  const ps = previewScale.value
  const offsetX = (form.illustrationPosition.offsetX ?? 0) * ps
  const offsetY = (form.illustrationPosition.offsetY ?? 0) * ps
  const s = form.illustrationPosition.scale ?? 1
  return {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 2,
    transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px)) scale(${s})`,
  }
})

// Drag
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

function startDrag(e) {
  if (!form.illustrationPosition) return
  isDragging.value = true
  dragStart.value = {
    x: e.clientX,
    y: e.clientY,
    offsetX: form.illustrationPosition.offsetX ?? 0,
    offsetY: form.illustrationPosition.offsetY ?? 0,
  }
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag)
}
function onDrag(e) {
  if (!isDragging.value || !form.illustrationPosition) return
  const ps = previewScale.value
  form.illustrationPosition.offsetX = dragStart.value.offsetX + (e.clientX - dragStart.value.x) / ps
  form.illustrationPosition.offsetY = dragStart.value.offsetY + (e.clientY - dragStart.value.y) / ps
}
function stopDrag() {
  isDragging.value = false
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
}

// Touch
function startDragTouch(e) {
  const touch = e.touches[0]
  if (!touch || !form.illustrationPosition) return
  isDragging.value = true
  dragStart.value = {
    x: touch.clientX,
    y: touch.clientY,
    offsetX: form.illustrationPosition.offsetX ?? 0,
    offsetY: form.illustrationPosition.offsetY ?? 0,
  }
  window.addEventListener('touchmove', onDragTouch, { passive: false })
  window.addEventListener('touchend', stopDragTouch)
}
function onDragTouch(e) {
  e.preventDefault()
  if (!isDragging.value || !form.illustrationPosition) return
  const touch = e.touches[0]
  const ps = previewScale.value
  form.illustrationPosition.offsetX = dragStart.value.offsetX + (touch.clientX - dragStart.value.x) / ps
  form.illustrationPosition.offsetY = dragStart.value.offsetY + (touch.clientY - dragStart.value.y) / ps
}
function stopDragTouch() {
  isDragging.value = false
  window.removeEventListener('touchmove', onDragTouch)
  window.removeEventListener('touchend', stopDragTouch)
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchmove', onDragTouch)
  window.removeEventListener('touchend', stopDragTouch)
})

function save() {
  const data = {
    name: form.name,
    width: form.width,
    height: form.height,
    backgroundImage: form.backgroundImage,
    illustrationImage: form.illustrationImage,
    illustrationColumn: form.illustrationColumn === NONE_VALUE ? '' : form.illustrationColumn,
    illustrationPosition: form.illustrationPosition ? { ...form.illustrationPosition } : null,
    overlayImage: form.overlayImage,
    contentFields: form.contentFields.map((f) => ({ ...f })),
  }

  const editingId = sourceType.value?.id
  if (isEditing.value && editingId) {
    store.updateCardType(editingId, data)
  } else {
    const id = store.addCardType(data)
    store.selectCardType(id)
  }

  if (!props.tabMode) {
    resetForm()
    isEditing.value = false
  }
  emit('saved')
}
</script>
