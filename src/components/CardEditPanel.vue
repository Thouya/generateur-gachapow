<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div v-if="card" class="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/55 backdrop-blur-sm" @click="$emit('close')" />

        <!-- Modal -->
        <div class="relative z-10 w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] bg-[var(--ui-bg)] rounded-xl shadow-2xl border border-[var(--ui-border)] flex flex-col overflow-hidden">

          <!-- Header -->
          <div class="px-4 py-3 border-b border-[var(--ui-border)] flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2">
              <UIcon name="i-lucide-pencil-line" class="text-[var(--ui-primary)]" />
              <h3 class="font-semibold text-sm sm:text-base">Éditer la carte</h3>
            </div>
            <UButton variant="ghost" color="neutral" icon="i-lucide-x" size="sm" @click="$emit('close')" />
          </div>

          <!-- Body : colonne sur mobile, ligne sur md+ -->
          <div class="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">

            <!-- Section aperçu + illustration -->
            <div class="shrink-0 w-full md:w-[288px] border-b md:border-b-0 md:border-r border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]">
              <!-- Mobile : ligne (carte gauche, illustration droite) -->
              <div class="flex md:hidden items-start gap-3 p-3">
                <div :style="containerStyleMobile" class="rounded-lg overflow-hidden shadow-md shrink-0">
                  <div :style="scaleStyleMobile">
                    <CardPreview :card-type="cardType" :card-data="localData" />
                  </div>
                </div>
                <div class="flex-1 min-w-0 flex flex-col gap-2">
                  <p class="text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wide">Illustration</p>
                  <div v-if="localData.__illustration || illustLocalPreview" class="relative rounded overflow-hidden border border-[var(--ui-border)]">
                    <img :src="illustLocalPreview || localData.__illustration" class="w-full object-cover max-h-20" alt="" />
                    <div v-if="illustUploading" class="absolute inset-0 bg-black/45 flex items-center justify-center">
                      <UIcon name="i-lucide-loader-circle" class="text-white text-base animate-spin" />
                    </div>
                    <button
                      v-if="!illustUploading"
                      class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow transition-colors"
                      @click="localData.__illustration = ''"
                    >
                      <UIcon name="i-lucide-x" class="text-[10px]" />
                    </button>
                  </div>
                  <button
                    :disabled="illustUploading"
                    class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-[var(--ui-radius)] border-2 border-dashed border-[var(--ui-border)] text-xs text-[var(--ui-text-muted)] hover:border-[var(--ui-primary)] hover:text-[var(--ui-primary)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="illustInput.click()"
                  >
                    <UIcon name="i-lucide-image-plus" class="text-sm" />
                    <span>{{ (localData.__illustration || illustLocalPreview) ? 'Changer' : 'Choisir' }}</span>
                  </button>
                  <input ref="illustInput" type="file" accept="image/*" class="hidden" @change="onIllustChange" />

                  <!-- Recadrage par carte (mobile) -->
                  <div v-if="localData.__illustration" class="space-y-1.5">
                    <div class="flex items-center justify-between">
                      <span class="text-xs text-[var(--ui-text-muted)]">Recadrage</span>
                      <div class="flex gap-1">
                        <UButton v-if="!localData.__illustrationPosition" size="xs" variant="soft" icon="i-lucide-move" @click="enableIllustPositioning">Activer</UButton>
                        <template v-else>
                          <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-rotate-ccw" @click="resetIllustPositioning" />
                          <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-x" @click="disableIllustPositioning" />
                        </template>
                      </div>
                    </div>
                    <template v-if="localData.__illustrationPosition">
                      <div
                        class="relative select-none rounded overflow-hidden mx-auto"
                        :class="isDraggingIllust ? 'cursor-grabbing' : 'cursor-grab'"
                        :style="{ width: illEditorW + 'px', height: illEditorH + 'px', background: '#c8c8c8' }"
                        @mousedown.prevent="startIllustDrag"
                        @touchstart.prevent="startIllustDragTouch"
                      >
                        <img v-if="cardType.backgroundImage" :src="cardType.backgroundImage" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:1;pointer-events:none;" draggable="false" alt="" />
                        <img :src="localData.__illustration" :style="illEditorImgStyle" draggable="false" alt="" />
                        <img v-if="cardType.overlayImage" :src="cardType.overlayImage" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:3;pointer-events:none;" draggable="false" alt="" />
                        <div style="position:absolute;inset:0;z-index:10;pointer-events:none;display:flex;align-items:center;justify-content:center;opacity:0.45;">
                          <div style="position:absolute;width:14px;height:1px;background:white;"></div>
                          <div style="position:absolute;width:1px;height:14px;background:white;"></div>
                        </div>
                      </div>
                      <div class="flex items-center gap-1.5">
                        <UIcon name="i-lucide-zoom-out" class="w-3.5 h-3.5 shrink-0 text-[var(--ui-text-dimmed)]" />
                        <input type="range" v-model.number="localData.__illustrationPosition.scale" min="0.3" max="5" step="0.05" class="flex-1 accent-[var(--ui-primary)] cursor-pointer" style="height:3px;" />
                        <UIcon name="i-lucide-zoom-in" class="w-3.5 h-3.5 shrink-0 text-[var(--ui-text-dimmed)]" />
                        <span class="text-xs text-[var(--ui-text-dimmed)] w-9 text-right tabular-nums">{{ Math.round((localData.__illustrationPosition.scale ?? 1) * 100) }}%</span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>

              <!-- Desktop : colonne (carte haut, illustration bas) -->
              <div class="hidden md:flex flex-col items-center gap-4 p-5 overflow-y-auto h-full">
                <div :style="containerStyleDesktop" class="rounded-xl overflow-hidden shadow-lg">
                  <div :style="scaleStyleDesktop">
                    <CardPreview :card-type="cardType" :card-data="localData" />
                  </div>
                </div>

                <div class="w-full">
                  <p class="text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wide mb-2">Illustration</p>
                  <div v-if="localData.__illustration || illustLocalPreview" class="relative mb-2 rounded-[var(--ui-radius)] overflow-hidden border border-[var(--ui-border)]">
                    <img :src="illustLocalPreview || localData.__illustration" class="w-full object-cover" alt="" />
                    <div v-if="illustUploading" class="absolute inset-0 bg-black/45 flex items-center justify-center">
                      <UIcon name="i-lucide-loader-circle" class="text-white text-2xl animate-spin" />
                    </div>
                    <button
                      v-if="!illustUploading"
                      class="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow transition-colors"
                      @click="localData.__illustration = ''"
                    >
                      <UIcon name="i-lucide-x" class="text-xs" />
                    </button>
                  </div>
                  <button
                    :disabled="illustUploading"
                    class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[var(--ui-radius)] border-2 border-dashed border-[var(--ui-border)] text-sm text-[var(--ui-text-muted)] hover:border-[var(--ui-primary)] hover:text-[var(--ui-primary)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    @click="illustInput.click()"
                  >
                    <UIcon name="i-lucide-image-plus" />
                    <span>{{ (localData.__illustration || illustLocalPreview) ? 'Changer l\'image' : 'Choisir une image' }}</span>
                  </button>

                  <!-- Recadrage par carte (desktop) -->
                  <div v-if="localData.__illustration" class="border-t border-[var(--ui-border)] pt-3 mt-1 space-y-2">
                    <div class="flex items-center justify-between">
                      <p class="text-xs font-semibold text-[var(--ui-text-muted)] uppercase tracking-wide">Recadrage</p>
                      <div class="flex items-center gap-1">
                        <UButton v-if="!localData.__illustrationPosition" size="xs" variant="soft" icon="i-lucide-move" @click="enableIllustPositioning">Activer</UButton>
                        <template v-else>
                          <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-rotate-ccw" title="Réinitialiser" @click="resetIllustPositioning" />
                          <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-x" title="Désactiver" @click="disableIllustPositioning" />
                        </template>
                      </div>
                    </div>
                    <template v-if="localData.__illustrationPosition">
                      <div
                        class="relative select-none rounded-lg overflow-hidden mx-auto"
                        :class="isDraggingIllust ? 'cursor-grabbing' : 'cursor-grab'"
                        :style="{ width: illEditorW + 'px', height: illEditorH + 'px', background: '#c8c8c8' }"
                        @mousedown.prevent="startIllustDrag"
                        @touchstart.prevent="startIllustDragTouch"
                      >
                        <img v-if="cardType.backgroundImage" :src="cardType.backgroundImage" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:1;pointer-events:none;" draggable="false" alt="" />
                        <img :src="localData.__illustration" :style="illEditorImgStyle" draggable="false" alt="" />
                        <img v-if="cardType.overlayImage" :src="cardType.overlayImage" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;z-index:3;pointer-events:none;" draggable="false" alt="" />
                        <div style="position:absolute;inset:0;z-index:10;pointer-events:none;display:flex;align-items:center;justify-content:center;opacity:0.45;">
                          <div style="position:absolute;width:18px;height:1px;background:white;"></div>
                          <div style="position:absolute;width:1px;height:18px;background:white;"></div>
                        </div>
                        <div style="position:absolute;bottom:4px;left:0;right:0;z-index:10;pointer-events:none;text-align:center;font-size:9px;color:rgba(255,255,255,0.7);">Glissez pour déplacer</div>
                      </div>
                      <div class="flex items-center gap-2">
                        <UIcon name="i-lucide-zoom-out" class="w-4 h-4 shrink-0 text-[var(--ui-text-dimmed)]" />
                        <input type="range" v-model.number="localData.__illustrationPosition.scale" min="0.3" max="5" step="0.05" class="flex-1 accent-[var(--ui-primary)] cursor-pointer" style="height:4px;" />
                        <UIcon name="i-lucide-zoom-in" class="w-4 h-4 shrink-0 text-[var(--ui-text-dimmed)]" />
                        <span class="text-xs text-[var(--ui-text-dimmed)] w-10 text-right tabular-nums">{{ Math.round((localData.__illustrationPosition.scale ?? 1) * 100) }}%</span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>

            <!-- Colonne droite : onglets Données / Notes -->
            <div class="flex-1 flex flex-col min-h-0 overflow-hidden">

              <!-- Onglets -->
              <div class="flex border-b border-[var(--ui-border)] shrink-0 px-1 pt-1">
                <button
                  v-for="tab in panelTabs"
                  :key="tab.key"
                  class="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-sm font-medium border-b-2 transition-colors"
                  :class="activeTab === tab.key
                    ? 'border-[var(--ui-primary)] text-[var(--ui-primary)]'
                    : 'border-transparent text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]'"
                  @click="activeTab = tab.key"
                >
                  <UIcon :name="tab.icon" class="text-sm" />
                  <span>{{ tab.label }}</span>
                  <span
                    v-if="tab.key === 'notes' && localData.__notes?.trim()"
                    class="w-1.5 h-1.5 rounded-full bg-[var(--ui-primary)] ml-0.5"
                  />
                </button>
              </div>

              <!-- Contenu onglet Données -->
              <div v-if="activeTab === 'data'" class="flex-1 overflow-y-auto p-4 sm:p-5">
                <div v-if="visibleColumns.length === 0" class="text-center text-[var(--ui-text-dimmed)] py-8 text-sm">
                  Aucune colonne CSV disponible.
                </div>
                <div v-else class="space-y-2.5">
                  <div v-for="col in visibleColumns" :key="col" class="flex items-start gap-2 sm:gap-3">
                    <label
                      class="text-sm text-[var(--ui-text-muted)] shrink-0 text-right capitalize hidden sm:block pt-1.5"
                      style="width: 110px"
                    >{{ col }}</label>
                    <textarea
                      v-model="localData[col]"
                      :ref="el => el && autoResizeTA(el)"
                      rows="1"
                      class="card-edit-field flex-1 resize-none overflow-hidden rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] px-2.5 py-1.5 text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-dimmed)] focus:border-[var(--ui-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-primary)] transition-colors leading-snug"
                      :placeholder="col"
                      @input="e => autoResizeTA(e.target)"
                    />
                  </div>
                </div>
              </div>

              <!-- Contenu onglet Notes -->
              <div v-else-if="activeTab === 'notes'" class="flex-1 flex flex-col p-4 sm:p-5 gap-3">
                <p class="text-xs text-[var(--ui-text-muted)]">Notes libres. Non imprimées dans le PDF.</p>
                <textarea
                  v-model="localData.__notes"
                  placeholder="Stratégie, remarques, TODO…"
                  class="flex-1 w-full resize-none rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] px-3 py-2.5 text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-dimmed)] focus:border-[var(--ui-primary)] focus:outline-none transition-colors min-h-[140px]"
                />
                <div class="flex items-center justify-between text-xs text-[var(--ui-text-dimmed)]">
                  <span>{{ (localData.__notes ?? '').length }} caractères</span>
                  <button v-if="localData.__notes?.trim()" class="hover:text-red-400 transition-colors" @click="localData.__notes = ''">Effacer</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-4 py-3 border-t border-[var(--ui-border)] flex items-center gap-2 shrink-0">
            <UButton color="primary" icon="i-lucide-save" class="flex-1" @click="save">Sauvegarder</UButton>
            <UButton variant="soft" color="neutral" @click="$emit('close')">Annuler</UButton>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useCardsStore } from '../stores/cards.js'
import CardPreview from './CardPreview.vue'

const props = defineProps({
  card: { type: Object, default: null },
  cardType: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['close', 'saved'])
const store = useCardsStore()

const localData = ref({})
const illustInput = ref(null)
const activeTab = ref('data')
const illustUploading = ref(false)
const illustLocalPreview = ref(null)
const isMobile = ref(false)

const panelTabs = [
  { key: 'data', label: 'Données', icon: 'i-lucide-table' },
  { key: 'notes', label: 'Notes', icon: 'i-lucide-notebook-pen' },
]

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}
onMounted(() => { checkMobile(); window.addEventListener('resize', checkMobile) })
onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('mousemove', onIllustDrag)
  window.removeEventListener('mouseup', stopIllustDrag)
  window.removeEventListener('touchmove', onIllustDragTouch)
  window.removeEventListener('touchend', stopIllustDragTouch)
})

function autoResizeTA(el) {
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

watch(() => props.card, (card) => {
  if (card) {
    localData.value = { ...card.data }
    activeTab.value = 'data'
    // Recalculer la hauteur des textareas après rendu
    nextTick(() => {
      document.querySelectorAll('.card-edit-field').forEach(autoResizeTA)
    })
  }
}, { immediate: true })

const visibleColumns = computed(() =>
  store.csvColumns.filter((col) => !col.startsWith('__'))
)

const cardNaturalWidth = computed(() => props.cardType?.width || 300)
const cardNaturalHeight = computed(() => props.cardType?.height || 420)

// Desktop : max 248px de large
const scaleDesktop = computed(() => Math.min(1, 248 / cardNaturalWidth.value))
const scaledWDesktop = computed(() => Math.round(cardNaturalWidth.value * scaleDesktop.value))
const scaledHDesktop = computed(() => Math.round(cardNaturalHeight.value * scaleDesktop.value))
const containerStyleDesktop = computed(() => ({
  width: `${scaledWDesktop.value}px`, height: `${scaledHDesktop.value}px`,
  position: 'relative', flexShrink: '0',
}))
const scaleStyleDesktop = computed(() => ({
  transform: `scale(${scaleDesktop.value})`, transformOrigin: 'top left',
  position: 'absolute', top: 0, left: 0,
}))

// Mobile : max 120px de large
const scaleMobile = computed(() => Math.min(1, 120 / cardNaturalWidth.value))
const scaledWMobile = computed(() => Math.round(cardNaturalWidth.value * scaleMobile.value))
const scaledHMobile = computed(() => Math.round(cardNaturalHeight.value * scaleMobile.value))
const containerStyleMobile = computed(() => ({
  width: `${scaledWMobile.value}px`, height: `${scaledHMobile.value}px`,
  position: 'relative', flexShrink: '0',
}))
const scaleStyleMobile = computed(() => ({
  transform: `scale(${scaleMobile.value})`, transformOrigin: 'top left',
  position: 'absolute', top: 0, left: 0,
}))

// ── Recadrage illustration par carte ────────────────────────────────────────
const illEditorW = 176 // fixe, centré dans la colonne gauche
const illEditorH = computed(() => Math.round(illEditorW * cardNaturalHeight.value / cardNaturalWidth.value))
const illEditorScale = computed(() => illEditorW / cardNaturalWidth.value)

const isDraggingIllust = ref(false)
const dragStartIllust = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

function enableIllustPositioning() {
  localData.value.__illustrationPosition = { offsetX: 0, offsetY: 0, scale: 1 }
}
function disableIllustPositioning() {
  localData.value.__illustrationPosition = null
}
function resetIllustPositioning() {
  const pos = localData.value.__illustrationPosition
  if (!pos) return
  pos.offsetX = 0
  pos.offsetY = 0
  pos.scale = 1
}

const illEditorImgStyle = computed(() => {
  const pos = localData.value.__illustrationPosition
  if (!pos) return {}
  const ps = illEditorScale.value
  return {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    zIndex: 2,
    transform: `translate(calc(-50% + ${(pos.offsetX ?? 0) * ps}px), calc(-50% + ${(pos.offsetY ?? 0) * ps}px)) scale(${pos.scale ?? 1})`,
  }
})

function startIllustDrag(e) {
  const pos = localData.value.__illustrationPosition
  if (!pos) return
  isDraggingIllust.value = true
  dragStartIllust.value = { x: e.clientX, y: e.clientY, offsetX: pos.offsetX ?? 0, offsetY: pos.offsetY ?? 0 }
  window.addEventListener('mousemove', onIllustDrag)
  window.addEventListener('mouseup', stopIllustDrag)
}
function onIllustDrag(e) {
  const pos = localData.value.__illustrationPosition
  if (!isDraggingIllust.value || !pos) return
  const ps = illEditorScale.value
  pos.offsetX = dragStartIllust.value.offsetX + (e.clientX - dragStartIllust.value.x) / ps
  pos.offsetY = dragStartIllust.value.offsetY + (e.clientY - dragStartIllust.value.y) / ps
}
function stopIllustDrag() {
  isDraggingIllust.value = false
  window.removeEventListener('mousemove', onIllustDrag)
  window.removeEventListener('mouseup', stopIllustDrag)
}
function startIllustDragTouch(e) {
  const touch = e.touches[0]
  const pos = localData.value.__illustrationPosition
  if (!touch || !pos) return
  isDraggingIllust.value = true
  dragStartIllust.value = { x: touch.clientX, y: touch.clientY, offsetX: pos.offsetX ?? 0, offsetY: pos.offsetY ?? 0 }
  window.addEventListener('touchmove', onIllustDragTouch, { passive: false })
  window.addEventListener('touchend', stopIllustDragTouch)
}
function onIllustDragTouch(e) {
  e.preventDefault()
  const pos = localData.value.__illustrationPosition
  if (!isDraggingIllust.value || !pos) return
  const touch = e.touches[0]
  const ps = illEditorScale.value
  pos.offsetX = dragStartIllust.value.offsetX + (touch.clientX - dragStartIllust.value.x) / ps
  pos.offsetY = dragStartIllust.value.offsetY + (touch.clientY - dragStartIllust.value.y) / ps
}
function stopIllustDragTouch() {
  isDraggingIllust.value = false
  window.removeEventListener('touchmove', onIllustDragTouch)
  window.removeEventListener('touchend', stopIllustDragTouch)
}

async function onIllustChange(event) {
  const file = event.target.files[0]
  if (!file || !file.type.startsWith('image/')) return
  event.target.value = ''

  // Aperçu immédiat
  const objectUrl = URL.createObjectURL(file)
  illustLocalPreview.value = objectUrl
  illustUploading.value = true

  const result = await store.uploadCardImage(file, 'card-illustration').catch((err) => ({ error: String(err) }))
  illustUploading.value = false

  if (result?.url) {
    URL.revokeObjectURL(objectUrl)
    illustLocalPreview.value = null
    localData.value = { ...localData.value, __illustration: result.url }
  } else {
    // Fallback base64 si l'upload échoue
    console.error('[CardEditPanel] Upload illustration échoué :', result?.error)
    const reader = new FileReader()
    reader.onload = (e) => {
      URL.revokeObjectURL(objectUrl)
      illustLocalPreview.value = null
      localData.value = { ...localData.value, __illustration: e.target.result }
    }
    reader.readAsDataURL(file)
  }
}

function save() {
  if (!props.card) return
  props.card.data = { ...localData.value }
  store.syncGeneratedCard(props.card)
  emit('saved')
  emit('close')
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.18s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
</style>
