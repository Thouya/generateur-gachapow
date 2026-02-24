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
                  <div v-if="localData.__illustration" class="relative rounded overflow-hidden border border-[var(--ui-border)]">
                    <img :src="localData.__illustration" class="w-full object-cover max-h-20" alt="" />
                    <button
                      class="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center shadow transition-colors"
                      @click="localData.__illustration = ''"
                    >
                      <UIcon name="i-lucide-x" class="text-[10px]" />
                    </button>
                  </div>
                  <button
                    class="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-[var(--ui-radius)] border-2 border-dashed border-[var(--ui-border)] text-xs text-[var(--ui-text-muted)] hover:border-[var(--ui-primary)] hover:text-[var(--ui-primary)] transition-colors cursor-pointer"
                    @click="illustInput.click()"
                  >
                    <UIcon name="i-lucide-image-plus" class="text-sm" />
                    <span>{{ localData.__illustration ? 'Changer' : 'Choisir' }}</span>
                  </button>
                  <input ref="illustInput" type="file" accept="image/*" class="hidden" @change="onIllustChange" />
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
                  <div v-if="localData.__illustration" class="relative mb-2 rounded-[var(--ui-radius)] overflow-hidden border border-[var(--ui-border)]">
                    <img :src="localData.__illustration" class="w-full object-cover" alt="" />
                    <button
                      class="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center shadow transition-colors"
                      @click="localData.__illustration = ''"
                    >
                      <UIcon name="i-lucide-x" class="text-xs" />
                    </button>
                  </div>
                  <button
                    class="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-[var(--ui-radius)] border-2 border-dashed border-[var(--ui-border)] text-sm text-[var(--ui-text-muted)] hover:border-[var(--ui-primary)] hover:text-[var(--ui-primary)] transition-colors cursor-pointer"
                    @click="illustInput.click()"
                  >
                    <UIcon name="i-lucide-image-plus" />
                    <span>{{ localData.__illustration ? 'Changer l\'image' : 'Choisir une image' }}</span>
                  </button>
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
const isMobile = ref(false)

const panelTabs = [
  { key: 'data', label: 'Données', icon: 'i-lucide-table' },
  { key: 'notes', label: 'Notes', icon: 'i-lucide-notebook-pen' },
]

function checkMobile() {
  isMobile.value = window.innerWidth < 768
}
onMounted(() => { checkMobile(); window.addEventListener('resize', checkMobile) })
onUnmounted(() => { window.removeEventListener('resize', checkMobile) })

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

function onIllustChange(event) {
  const file = event.target.files[0]
  if (!file || !file.type.startsWith('image/')) return
  const reader = new FileReader()
  reader.onload = (e) => {
    localData.value = { ...localData.value, __illustration: e.target.result }
  }
  reader.readAsDataURL(file)
  event.target.value = ''
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
