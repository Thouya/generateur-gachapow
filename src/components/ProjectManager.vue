<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Projets</h3>
        <UBadge v-if="store.projects.length > 0" color="neutral" variant="subtle">
          {{ store.projects.length }} projet{{ store.projects.length > 1 ? 's' : '' }}
        </UBadge>
      </div>
    </template>

    <!-- Liste des projets -->
    <div v-if="store.projects.length > 0" class="flex flex-wrap gap-2 mb-4">
      <div
        v-for="project in store.projects"
        :key="project.id"
        class="flex items-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all text-sm"
        :class="store.selectedProjectId === project.id
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary-300'"
        @click="store.selectProject(project.id)"
      >
        <UIcon name="i-lucide-folder" class="text-base" />

        <!-- Mode renommage -->
        <template v-if="renamingId === project.id">
          <UInput
            v-model="renameValue"
            size="xs"
            class="w-32"
            autofocus
            @keyup.enter="confirmRename"
            @keyup.escape="renamingId = null"
          />
          <UButton size="xs" variant="ghost" icon="i-lucide-check" @click.stop="confirmRename" />
          <UButton size="xs" variant="ghost" icon="i-lucide-x" @click.stop="renamingId = null" />
        </template>

        <!-- Mode normal -->
        <template v-else>
          <span class="font-semibold">{{ project.name }}</span>
          <span class="text-gray-400 text-xs">
            {{ project.cardTypes.length }} type{{ project.cardTypes.length > 1 ? 's' : '' }}
            · {{ project.generatedCards.length }} carte{{ project.generatedCards.length > 1 ? 's' : '' }}
          </span>
          <div v-if="store.selectedProjectId === project.id" class="flex gap-1">
            <UButton
              size="xs"
              variant="ghost"
              icon="i-lucide-pencil"
              @click.stop="startRename(project)"
            />
            <UButton
              size="xs"
              variant="ghost"
              color="error"
              icon="i-lucide-trash-2"
              @click.stop="confirmDelete(project)"
            />
          </div>
        </template>
      </div>
    </div>

    <div v-else class="text-center text-gray-400 text-sm py-4 mb-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <UIcon name="i-lucide-folder-plus" class="text-2xl mb-2" />
      <p>Aucun projet. Crée ton premier projet pour commencer.</p>
    </div>

    <!-- Formulaire nouveau projet -->
    <form class="flex items-center gap-2" @submit.prevent="createProject">
      <UInput
        v-model="newProjectName"
        placeholder="Nom du nouveau projet…"
        size="sm"
        class="flex-1"
      />
      <UButton
        type="submit"
        icon="i-lucide-plus"
        label="Créer"
        size="sm"
        :disabled="!newProjectName.trim()"
      />
    </form>
  </UCard>
</template>

<script setup>
import { ref } from 'vue'
import { useCardsStore } from '../stores/cards.js'

const store = useCardsStore()

const newProjectName = ref('')
const renamingId = ref(null)
const renameValue = ref('')

function createProject() {
  const name = newProjectName.value.trim()
  if (!name) return
  store.addProject(name)
  newProjectName.value = ''
}

function startRename(project) {
  renamingId.value = project.id
  renameValue.value = project.name
}

function confirmRename() {
  const name = renameValue.value.trim()
  if (name && renamingId.value) {
    store.renameProject(renamingId.value, name)
  }
  renamingId.value = null
}

function confirmDelete(project) {
  if (window.confirm(`Supprimer le projet "${project.name}" et toutes ses données ?`)) {
    store.deleteProject(project.id)
  }
}
</script>
