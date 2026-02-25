<template>
  <div>
    <!-- Barre d'outils -->
    <div class="flex flex-wrap items-center gap-2 mb-4">
      <span class="text-sm text-[var(--ui-text-dimmed)]">
        {{ filteredMaterials.length }} élément{{ filteredMaterials.length !== 1 ? 's' : '' }}
      </span>
      <div class="flex-1 min-w-0">
        <UInput
          v-model="search"
          placeholder="Rechercher…"
          icon="i-lucide-search"
          size="sm"
          class="w-full sm:w-56"
          :ui="{ base: 'w-full' }"
        />
      </div>
      <UButton
        size="sm"
        icon="i-lucide-plus"
        @click="handleAdd"
      >
        <span class="hidden sm:inline">Ajouter</span>
      </UButton>
    </div>

    <!-- Liste vide -->
    <div v-if="store.materials.length === 0" class="text-center py-16 text-[var(--ui-text-dimmed)]">
      <UIcon name="i-lucide-package" class="text-4xl mb-3" />
      <p class="font-medium mb-1">Aucun matériel</p>
      <p class="text-sm">Ajoute les composants nécessaires à ton jeu</p>
    </div>

    <!-- Liste des éléments -->
    <div v-else class="space-y-2">
      <div
        v-for="item in filteredMaterials"
        :key="item.id"
        class="group flex items-center gap-3 p-3 rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg)] hover:border-[var(--ui-primary)]/40 hover:bg-[var(--ui-bg-elevated)] transition-colors cursor-pointer"
        @click="openModal(item)"
      >
        <!-- Badge quantité -->
        <div class="shrink-0 w-10 h-10 rounded-[var(--ui-radius)] bg-[var(--ui-primary)]/10 flex items-center justify-center">
          <span class="text-sm font-bold text-[var(--ui-primary)]">×{{ item.quantity }}</span>
        </div>

        <!-- Infos -->
        <div class="flex-1 min-w-0">
          <p class="font-medium text-sm text-[var(--ui-text)] truncate">{{ item.name || 'Sans nom' }}</p>
          <p v-if="item.description" class="text-xs text-[var(--ui-text-muted)] truncate mt-0.5">{{ item.description }}</p>
        </div>

        <!-- Indicateurs -->
        <div class="shrink-0 flex items-center gap-2 text-[var(--ui-text-dimmed)]">
          <span v-if="item.files?.length" class="flex items-center gap-1 text-xs">
            <UIcon name="i-lucide-paperclip" class="text-sm" />
            {{ item.files.length }}
          </span>
          <span v-if="item.notes?.trim()" class="flex items-center gap-1 text-xs">
            <UIcon name="i-lucide-notebook-pen" class="text-sm" />
          </span>
        </div>

        <!-- Supprimer -->
        <UButton
          size="xs"
          variant="ghost"
          color="error"
          icon="i-lucide-trash-2"
          class="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          @click.stop="handleDelete(item)"
        />
      </div>
    </div>

    <!-- Résultat de recherche vide -->
    <div v-if="store.materials.length > 0 && filteredMaterials.length === 0" class="text-center py-10 text-[var(--ui-text-dimmed)] text-sm">
      Aucun résultat pour « {{ search }} »
    </div>

    <!-- ─── Modale d'édition ─── -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div
          v-if="editingItem"
          class="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          <!-- Backdrop -->
          <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal" />

          <!-- Contenu -->
          <div class="relative z-10 w-full max-w-lg bg-[var(--ui-bg)] rounded-[var(--ui-radius)] border border-[var(--ui-border)] shadow-2xl flex flex-col max-h-[90vh]">

            <!-- En-tête : nom + quantité + fermer -->
            <div class="flex items-center gap-3 p-4 border-b border-[var(--ui-border)]">
              <UIcon name="i-lucide-package" class="shrink-0 text-[var(--ui-primary)] text-lg" />
              <input
                v-model="localItem.name"
                placeholder="Nom de l'élément"
                class="flex-1 min-w-0 bg-transparent text-base font-semibold text-[var(--ui-text)] placeholder:text-[var(--ui-text-dimmed)] outline-none"
                @input="scheduleSave"
              />
              <div class="flex items-center gap-1.5 shrink-0">
                <span class="text-xs text-[var(--ui-text-muted)]">Qté</span>
                <input
                  v-model.number="localItem.quantity"
                  type="number"
                  min="0"
                  class="w-14 text-center bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-[var(--ui-radius)] px-2 py-1 text-sm text-[var(--ui-text)] outline-none focus:border-[var(--ui-primary)] transition-colors"
                  @input="scheduleSave"
                />
              </div>
              <UButton
                size="xs"
                variant="ghost"
                color="neutral"
                icon="i-lucide-x"
                @click="closeModal"
              />
            </div>

            <!-- Tabs -->
            <div class="flex border-b border-[var(--ui-border)] px-1 pt-1">
              <button
                v-for="tab in modalTabs"
                :key="tab.id"
                class="relative px-3 py-2 text-sm font-medium transition-colors"
                :class="activeTab === tab.id
                  ? 'text-[var(--ui-primary)]'
                  : 'text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]'"
                @click="activeTab = tab.id"
              >
                <div class="flex items-center gap-1.5">
                  <UIcon :name="tab.icon" class="text-sm" />
                  <span>{{ tab.label }}</span>
                  <span v-if="tab.id === 'files' && localItem.files?.length" class="ml-0.5 text-xs bg-[var(--ui-primary)]/15 text-[var(--ui-primary)] rounded-full px-1.5 py-0.5 leading-none">{{ localItem.files.length }}</span>
                </div>
                <div v-if="activeTab === tab.id" class="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--ui-primary)] rounded-t" />
              </button>
            </div>

            <!-- Corps scrollable -->
            <div class="flex-1 overflow-y-auto p-4">

              <!-- Onglet Détails -->
              <div v-if="activeTab === 'details'">
                <label class="block text-xs font-medium text-[var(--ui-text-muted)] mb-1.5">Description</label>
                <textarea
                  v-model="localItem.description"
                  placeholder="Décris cet élément de matériel…"
                  rows="6"
                  class="w-full resize-none rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] px-3 py-2 text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-dimmed)] focus:border-[var(--ui-primary)] focus:outline-none transition-colors leading-relaxed"
                  @input="scheduleSave"
                />
              </div>

              <!-- Onglet Notes -->
              <div v-else-if="activeTab === 'notes'">
                <label class="block text-xs font-medium text-[var(--ui-text-muted)] mb-1.5">Notes</label>
                <textarea
                  v-model="localItem.notes"
                  placeholder="Notes internes, remarques, idées…"
                  rows="6"
                  class="w-full resize-none rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] px-3 py-2 text-sm text-[var(--ui-text)] placeholder:text-[var(--ui-text-dimmed)] focus:border-[var(--ui-primary)] focus:outline-none transition-colors leading-relaxed"
                  @input="scheduleSave"
                />
                <p class="mt-1 text-right text-xs text-[var(--ui-text-dimmed)]">{{ localItem.notes?.length ?? 0 }} caractères</p>
              </div>

              <!-- Onglet Fichiers -->
              <div v-else-if="activeTab === 'files'">
                <!-- Zone d'upload -->
                <div
                  class="mb-4 border-2 border-dashed border-[var(--ui-border)] rounded-[var(--ui-radius)] p-6 text-center transition-colors"
                  :class="isDragging ? 'border-[var(--ui-primary)] bg-[var(--ui-primary)]/5' : 'hover:border-[var(--ui-primary)]/50'"
                  @dragover.prevent="isDragging = true"
                  @dragleave="isDragging = false"
                  @drop.prevent="handleDrop"
                >
                  <UIcon name="i-lucide-upload-cloud" class="text-3xl text-[var(--ui-text-dimmed)] mb-2" />
                  <p class="text-sm text-[var(--ui-text-muted)] mb-2">Glisse des fichiers ici ou</p>
                  <UButton
                    size="sm"
                    variant="outline"
                    color="neutral"
                    icon="i-lucide-folder-open"
                    :loading="uploading"
                    @click="fileInput?.click()"
                  >
                    Choisir des fichiers
                  </UButton>
                  <input
                    ref="fileInput"
                    type="file"
                    multiple
                    class="hidden"
                    @change="handleFileInput"
                  />
                </div>

                <!-- Erreur upload -->
                <UAlert v-if="uploadError" color="error" icon="i-lucide-alert-circle" :description="uploadError" class="mb-3" />

                <!-- Liste des fichiers -->
                <div v-if="localItem.files?.length" class="space-y-2">
                  <div
                    v-for="(file, idx) in localItem.files"
                    :key="file.path"
                    class="flex items-center gap-3 p-2.5 rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] group"
                  >
                    <UIcon :name="fileIcon(file.type)" class="shrink-0 text-lg text-[var(--ui-text-muted)]" />
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-[var(--ui-text)] truncate">{{ file.name }}</p>
                      <p class="text-xs text-[var(--ui-text-dimmed)]">{{ formatSize(file.size) }}</p>
                    </div>
                    <a
                      :href="file.url"
                      target="_blank"
                      class="shrink-0"
                      @click.stop
                    >
                      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-download" />
                    </a>
                    <UButton
                      size="xs"
                      variant="ghost"
                      color="error"
                      icon="i-lucide-trash-2"
                      :loading="deletingFile === file.path"
                      @click="handleDeleteFile(file.path)"
                    />
                  </div>
                </div>
                <p v-else class="text-center text-sm text-[var(--ui-text-dimmed)] py-4">
                  Aucun fichier joint
                </p>
              </div>
            </div>

            <!-- Pied : indicateur sauvegarde -->
            <div class="px-4 py-2 border-t border-[var(--ui-border)] flex justify-end">
              <Transition name="fade">
                <span v-if="saveStatus === 'saved'" class="flex items-center gap-1 text-xs text-[var(--ui-success)]">
                  <UIcon name="i-lucide-check-circle" class="text-sm" />
                  Sauvegardé
                </span>
                <span v-else-if="saveStatus === 'saving'" class="flex items-center gap-1 text-xs text-[var(--ui-text-dimmed)]">
                  <UIcon name="i-lucide-loader-2" class="text-sm animate-spin" />
                  Sauvegarde…
                </span>
              </Transition>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCardsStore } from '../stores/cards.js'
import { useConfirm } from '../composables/useConfirm.js'

const store = useCardsStore()
const { confirm } = useConfirm()

// ── Liste ──────────────────────────────────────────
const search = ref('')

const filteredMaterials = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return store.materials
  return store.materials.filter(
    (m) =>
      m.name?.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q)
  )
})

async function handleAdd() {
  const id = store.addMaterial()
  // Ouvrir directement la modale du nouvel élément
  await new Promise((r) => setTimeout(r, 50))
  const item = store.materials.find((m) => m.id === id)
  if (item) openModal(item)
}

async function handleDelete(item) {
  const ok = await confirm({ title: `Supprimer « ${item.name || 'Sans nom'} » ?`, message: item.files?.length ? `${item.files.length} fichier(s) joint(s) seront également supprimés.` : '' })
  if (!ok) return
  store.deleteMaterial(item.id)
}

// ── Modale ─────────────────────────────────────────
const editingItem = ref(null)
const localItem = ref(null)
const activeTab = ref('details')
const saveStatus = ref(null)
const uploading = ref(false)
const uploadError = ref('')
const deletingFile = ref(null)
const isDragging = ref(false)
const fileInput = ref(null)
let saveTimer = null
let statusTimer = null

const modalTabs = [
  { id: 'details', label: 'Détails', icon: 'i-lucide-align-left' },
  { id: 'notes', label: 'Notes', icon: 'i-lucide-notebook-pen' },
  { id: 'files', label: 'Fichiers', icon: 'i-lucide-paperclip' },
]

function openModal(item) {
  editingItem.value = item
  localItem.value = JSON.parse(JSON.stringify(item)) // deep clone
  activeTab.value = 'details'
  uploadError.value = ''
  saveStatus.value = null
}

function closeModal() {
  clearTimeout(saveTimer)
  clearTimeout(statusTimer)
  editingItem.value = null
  localItem.value = null
}

// Sync localItem.files quand les fichiers changent dans le store (après upload)
watch(
  () => {
    if (!editingItem.value) return null
    return store.materials.find((m) => m.id === editingItem.value.id)?.files
  },
  (newFiles) => {
    if (newFiles && localItem.value) {
      localItem.value.files = JSON.parse(JSON.stringify(newFiles))
    }
  },
  { deep: true }
)

function scheduleSave() {
  if (!editingItem.value) return
  clearTimeout(saveTimer)
  clearTimeout(statusTimer)
  saveStatus.value = 'saving'
  saveTimer = setTimeout(() => {
    store.updateMaterial(editingItem.value.id, {
      name: localItem.value.name,
      quantity: localItem.value.quantity,
      description: localItem.value.description,
      notes: localItem.value.notes,
    })
    saveStatus.value = 'saved'
    statusTimer = setTimeout(() => { saveStatus.value = null }, 2000)
  }, 600)
}

// ── Fichiers ───────────────────────────────────────
async function uploadFiles(files) {
  if (!files.length || !editingItem.value) return
  uploadError.value = ''
  uploading.value = true
  for (const file of Array.from(files)) {
    const { error } = await store.uploadMaterialFile(editingItem.value.id, file)
    if (error) {
      uploadError.value = `Erreur lors de l'upload de « ${file.name }» : ${error.message || error}`
    }
  }
  uploading.value = false
}

function handleFileInput(e) {
  uploadFiles(e.target.files)
  e.target.value = ''
}

function handleDrop(e) {
  isDragging.value = false
  uploadFiles(e.dataTransfer.files)
}

async function handleDeleteFile(filePath) {
  if (!editingItem.value) return
  const file = editingItem.value.files?.find((f) => f.path === filePath)
  const ok = await confirm({ title: 'Supprimer ce fichier ?', message: file?.name ?? filePath })
  if (!ok) return
  deletingFile.value = filePath
  await store.deleteMaterialFile(editingItem.value.id, filePath)
  deletingFile.value = null
}

// ── Utilitaires ────────────────────────────────────
function fileIcon(type) {
  if (!type) return 'i-lucide-file'
  if (type.startsWith('image/')) return 'i-lucide-image'
  if (type === 'application/pdf') return 'i-lucide-file-text'
  if (type.includes('spreadsheet') || type.includes('excel')) return 'i-lucide-table'
  if (type.includes('word') || type.includes('document')) return 'i-lucide-file-text'
  return 'i-lucide-file'
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}
</script>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.2s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to { opacity: 0; }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
