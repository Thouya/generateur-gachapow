<template>
  <!-- ─── Liste des questionnaires ─── -->
  <template v-if="!selectedQId">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-lg font-semibold">Questionnaires</h2>
        <p class="text-sm text-[var(--ui-text-muted)]">
          {{ surveyStore.questionnaires.length }} questionnaire{{ surveyStore.questionnaires.length > 1 ? 's' : '' }}
        </p>
      </div>
      <UButton icon="i-lucide-plus" :loading="creating" @click="createQ">Nouveau</UButton>
    </div>

    <!-- Chargement -->
    <div v-if="surveyStore.loading" class="flex items-center justify-center py-16">
      <UIcon name="i-lucide-loader-2" class="text-3xl animate-spin text-[var(--ui-text-dimmed)]" />
    </div>

    <!-- Vide -->
    <div
      v-else-if="!surveyStore.questionnaires.length"
      class="text-center py-20 text-[var(--ui-text-dimmed)]"
    >
      <UIcon name="i-lucide-clipboard-list" class="text-5xl mb-4" />
      <p class="text-base mb-1">Aucun questionnaire</p>
      <p class="text-sm mb-6 max-w-xs mx-auto">
        Créez un questionnaire pour recueillir des retours sur votre jeu.
      </p>
      <UButton icon="i-lucide-plus" @click="createQ">Créer un questionnaire</UButton>
    </div>

    <!-- Liste -->
    <div v-else class="space-y-2">
      <div
        v-for="q in surveyStore.questionnaires"
        :key="q.id"
        class="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg)] p-4 flex items-center gap-3 group hover:border-[var(--ui-border-accented)] transition-colors"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-medium text-sm">{{ q.title }}</span>
            <span
              class="text-xs px-2 py-0.5 rounded-full font-medium"
              :class="q.isPublished
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)]'"
            >
              {{ q.isPublished ? 'Publié' : 'Brouillon' }}
            </span>
          </div>
          <p class="text-xs text-[var(--ui-text-dimmed)] mt-1">
            {{ q.questions.length }} question{{ q.questions.length > 1 ? 's' : '' }}
          </p>
        </div>
        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <UButton
            v-if="q.isPublished"
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-link"
            title="Copier le lien"
            @click="copyLink(q)"
          />
          <UButton
            size="xs"
            variant="ghost"
            color="neutral"
            icon="i-lucide-edit-3"
            @click="openEditor(q.id)"
          />
          <UButton
            size="xs"
            variant="ghost"
            color="error"
            icon="i-lucide-trash-2"
            @click="deleteQ(q.id)"
          />
        </div>
      </div>
    </div>
  </template>

  <!-- ─── Éditeur de questionnaire ─── -->
  <template v-else-if="editQ">
    <!-- Barre du haut -->
    <div class="flex items-start gap-3 mb-4 flex-wrap">
      <UButton
        icon="i-lucide-arrow-left"
        size="sm"
        variant="ghost"
        color="neutral"
        @click="selectedQId = null"
      />
      <input
        v-model="editQ.title"
        class="flex-1 min-w-0 text-xl font-bold bg-transparent border-none outline-none text-[var(--ui-text)] placeholder-[var(--ui-text-dimmed)]"
        placeholder="Titre du questionnaire"
        @input="scheduleSave"
      />
      <!-- Toggle publié/brouillon -->
      <button
        class="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border transition-colors shrink-0"
        :class="editQ.isPublished
          ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
          : 'border-[var(--ui-border)] text-[var(--ui-text-muted)] hover:border-[var(--ui-border-accented)]'"
        @click="togglePublish"
      >
        <UIcon :name="editQ.isPublished ? 'i-lucide-globe' : 'i-lucide-lock'" class="text-sm" />
        {{ editQ.isPublished ? 'Publié' : 'Brouillon' }}
      </button>
      <!-- Statut sauvegarde -->
      <Transition name="fade">
        <span v-if="saveStatus === 'saved'" class="flex items-center gap-1 text-xs text-[var(--ui-success)] shrink-0">
          <UIcon name="i-lucide-check-circle" class="text-sm" />
          Sauvegardé
        </span>
        <span v-else-if="saveStatus === 'saving'" class="flex items-center gap-1 text-xs text-[var(--ui-text-dimmed)] shrink-0">
          <UIcon name="i-lucide-loader-2" class="text-sm animate-spin" />
          Sauvegarde…
        </span>
      </Transition>
    </div>

    <!-- Lien si publié -->
    <div
      v-if="editQ.isPublished"
      class="mb-4 flex items-center gap-2 p-3 rounded-[var(--ui-radius)] bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800"
    >
      <UIcon name="i-lucide-globe" class="text-sm text-green-600 dark:text-green-400 shrink-0" />
      <span class="text-xs text-[var(--ui-text-muted)] flex-1 truncate font-mono">{{ surveyLink }}</span>
      <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-copy" @click="copyLink(editQ)" />
    </div>

    <!-- Description -->
    <textarea
      v-model="editQ.description"
      class="w-full text-sm bg-[var(--ui-bg-elevated)] border border-[var(--ui-border)] rounded-[var(--ui-radius)] px-3 py-2 resize-none text-[var(--ui-text)] placeholder-[var(--ui-text-dimmed)] outline-none focus:ring-1 focus:ring-[var(--ui-primary)] mb-4"
      rows="2"
      placeholder="Description (optionnel)"
      @input="scheduleSave"
    />

    <!-- Onglets -->
    <div class="flex border-b border-[var(--ui-border)] mb-5">
      <button
        v-for="tab in editorTabs"
        :key="tab.key"
        class="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors"
        :class="editorTab === tab.key
          ? 'border-[var(--ui-primary)] text-[var(--ui-primary)]'
          : 'border-transparent text-[var(--ui-text-muted)] hover:text-[var(--ui-text)]'"
        @click="onTabClick(tab.key)"
      >
        <UIcon :name="tab.icon" class="text-sm" />
        {{ tab.label }}
        <span
          v-if="tab.key === 'responses' && surveyStore.responses.length"
          class="ml-1 text-xs bg-[var(--ui-bg-elevated)] px-1.5 py-0.5 rounded-full"
        >
          {{ surveyStore.responses.length }}
        </span>
      </button>
    </div>

    <!-- ─── Onglet Questions ─── -->
    <div v-if="editorTab === 'questions'">
      <!-- Liste des questions -->
      <div class="space-y-2 mb-4">
        <!-- Vide -->
        <div
          v-if="!editQ.questions.length"
          class="text-center py-10 text-[var(--ui-text-dimmed)] border border-dashed border-[var(--ui-border)] rounded-[var(--ui-radius)]"
        >
          <UIcon name="i-lucide-list-plus" class="text-3xl mb-2" />
          <p class="text-sm">Ajoutez votre première question ci-dessous</p>
        </div>

        <div
          v-for="(q, idx) in editQ.questions"
          :key="q.id"
          class="rounded-[var(--ui-radius)] border bg-[var(--ui-bg)] overflow-hidden transition-colors"
          :class="expandedQId === q.id ? 'border-[var(--ui-primary)]/40' : 'border-[var(--ui-border)]'"
        >
          <!-- En-tête de la question -->
          <div
            class="flex items-center gap-2 px-3 py-2.5 cursor-pointer hover:bg-[var(--ui-bg-elevated)] transition-colors"
            @click="toggleExpand(q.id)"
          >
            <!-- Flèches haut/bas -->
            <div class="flex flex-col">
              <button
                class="text-[var(--ui-text-dimmed)] hover:text-[var(--ui-text)] disabled:opacity-30 leading-none p-0.5"
                :disabled="idx === 0"
                @click.stop="moveQuestion(idx, -1)"
              >
                <UIcon name="i-lucide-chevron-up" class="text-xs" />
              </button>
              <button
                class="text-[var(--ui-text-dimmed)] hover:text-[var(--ui-text)] disabled:opacity-30 leading-none p-0.5"
                :disabled="idx === editQ.questions.length - 1"
                @click.stop="moveQuestion(idx, 1)"
              >
                <UIcon name="i-lucide-chevron-down" class="text-xs" />
              </button>
            </div>

            <!-- Badge type -->
            <span class="text-xs px-2 py-0.5 rounded bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)] font-medium shrink-0">
              {{ typeInfo(q.type).label }}
            </span>

            <!-- Label -->
            <span
              class="flex-1 text-sm truncate"
              :class="q.label ? 'text-[var(--ui-text)]' : 'italic text-[var(--ui-text-dimmed)]'"
            >
              {{ q.label || 'Question sans label…' }}
            </span>

            <!-- Requis -->
            <span v-if="q.required" class="text-xs text-red-500 font-bold shrink-0">*</span>

            <!-- Supprimer -->
            <UButton
              size="xs"
              variant="ghost"
              color="error"
              icon="i-lucide-x"
              @click.stop="removeQuestion(idx)"
            />

            <!-- Expand icon -->
            <UIcon
              :name="expandedQId === q.id ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              class="text-sm text-[var(--ui-text-dimmed)] shrink-0"
            />
          </div>

          <!-- Éditeur étendu -->
          <div
            v-if="expandedQId === q.id"
            class="px-4 pt-3 pb-4 border-t border-[var(--ui-border)] space-y-3 bg-[var(--ui-bg-elevated)]/30"
          >
            <!-- Type + Requis -->
            <div class="flex items-center gap-3 flex-wrap">
              <select
                v-model="q.type"
                class="text-xs border border-[var(--ui-border)] rounded-[var(--ui-radius)] px-2 py-1.5 bg-[var(--ui-bg)] text-[var(--ui-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-primary)]"
                @change="onTypeChange(q)"
              >
                <option v-for="t in QUESTION_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
              </select>
              <label class="flex items-center gap-1.5 cursor-pointer text-sm select-none">
                <input type="checkbox" v-model="q.required" class="rounded accent-[var(--ui-primary)]" @change="saveQuestions" />
                <span class="text-[var(--ui-text-muted)]">Requis</span>
              </label>
            </div>

            <!-- Label -->
            <input
              v-model="q.label"
              type="text"
              class="w-full text-sm border border-[var(--ui-border)] rounded-[var(--ui-radius)] px-3 py-1.5 bg-[var(--ui-bg)] text-[var(--ui-text)] placeholder-[var(--ui-text-dimmed)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-primary)]"
              placeholder="Label de la question"
              @input="scheduleSaveQ"
            />

            <!-- ── Rating : échelle ── -->
            <div v-if="q.type === 'rating'" class="space-y-1">
              <p class="text-xs text-[var(--ui-text-muted)]">Échelle</p>
              <div class="flex gap-4">
                <label class="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input type="radio" v-model="q.scale" :value="5" class="accent-[var(--ui-primary)]" @change="saveQuestions" />
                  1 à 5 ⭐
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer text-sm">
                  <input type="radio" v-model="q.scale" :value="10" class="accent-[var(--ui-primary)]" @change="saveQuestions" />
                  1 à 10
                </label>
              </div>
            </div>

            <!-- ── Choix unique / multiple : options ── -->
            <div v-if="q.type === 'single_choice' || q.type === 'multiple_choice'" class="space-y-2">
              <p class="text-xs text-[var(--ui-text-muted)]">Options</p>
              <div v-for="(_, oi) in q.options" :key="oi" class="flex gap-2">
                <input
                  v-model="q.options[oi]"
                  type="text"
                  class="flex-1 text-sm border border-[var(--ui-border)] rounded-[var(--ui-radius)] px-2 py-1 bg-[var(--ui-bg)] text-[var(--ui-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-primary)]"
                  :placeholder="`Option ${oi + 1}`"
                  @input="scheduleSaveQ"
                />
                <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-x" @click="removeOption(q, oi)" />
              </div>
              <UButton size="xs" variant="ghost" color="neutral" icon="i-lucide-plus" @click="addOption(q)">
                Ajouter une option
              </UButton>
            </div>

            <!-- ── Cartes du projet ── -->
            <div v-if="q.type === 'project_cards'" class="space-y-2">
              <p class="text-xs text-[var(--ui-text-muted)]">Type de carte à afficher</p>
              <select
                v-model="q.cardTypeId"
                class="w-full text-sm border border-[var(--ui-border)] rounded-[var(--ui-radius)] px-2 py-1.5 bg-[var(--ui-bg)] text-[var(--ui-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-primary)]"
                @change="saveQuestions"
              >
                <option value="">— Sélectionner un type de carte —</option>
                <option v-for="ct in cardsStore.cardTypes" :key="ct.id" :value="ct.id">
                  {{ ct.name }}
                </option>
              </select>
              <label class="flex items-center gap-1.5 cursor-pointer text-sm">
                <input type="checkbox" v-model="q.multiple" class="rounded accent-[var(--ui-primary)]" @change="saveQuestions" />
                <span class="text-[var(--ui-text-muted)]">Sélection multiple</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer text-sm">
                <input type="checkbox" v-model="q.withFeedback" class="rounded accent-[var(--ui-primary)]" @change="saveQuestions" />
                <span class="text-[var(--ui-text-muted)]">Retour libre par carte sélectionnée</span>
              </label>
            </div>

            <!-- ── Matériel du projet ── -->
            <div v-if="q.type === 'project_materials'" class="space-y-2">
              <label class="flex items-center gap-1.5 cursor-pointer text-sm">
                <input type="checkbox" v-model="q.multiple" class="rounded accent-[var(--ui-primary)]" @change="saveQuestions" />
                <span class="text-[var(--ui-text-muted)]">Sélection multiple</span>
              </label>
              <label class="flex items-center gap-1.5 cursor-pointer text-sm">
                <input type="checkbox" v-model="q.withFeedback" class="rounded accent-[var(--ui-primary)]" @change="saveQuestions" />
                <span class="text-[var(--ui-text-muted)]">Retour libre par élément sélectionné</span>
              </label>
              <div class="flex items-center gap-2 text-xs text-[var(--ui-text-dimmed)]">
                <span>{{ q.materialsSnapshot?.length ?? 0 }} élément(s) capturé(s)</span>
                <button
                  class="text-[var(--ui-primary)] hover:underline"
                  @click="refreshMaterialsSnapshot(q)"
                >
                  Actualiser
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ajouter une question -->
      <div class="flex items-center gap-2 flex-wrap">
        <select
          v-model="newQuestionType"
          class="text-sm border border-[var(--ui-border)] rounded-[var(--ui-radius)] px-3 py-1.5 bg-[var(--ui-bg)] text-[var(--ui-text)] focus:outline-none focus:ring-1 focus:ring-[var(--ui-primary)]"
        >
          <option v-for="t in QUESTION_TYPES" :key="t.value" :value="t.value">{{ t.label }}</option>
        </select>
        <UButton icon="i-lucide-plus" @click="addQuestion">Ajouter une question</UButton>
      </div>
    </div>

    <!-- ─── Onglet Réponses ─── -->
    <div v-else-if="editorTab === 'responses'">
      <!-- Chargement -->
      <div v-if="surveyStore.loadingResponses" class="flex items-center justify-center py-16">
        <UIcon name="i-lucide-loader-2" class="text-3xl animate-spin text-[var(--ui-text-dimmed)]" />
      </div>

      <!-- Aucune réponse -->
      <div
        v-else-if="!surveyStore.responses.length"
        class="text-center py-16 text-[var(--ui-text-dimmed)]"
      >
        <UIcon name="i-lucide-inbox" class="text-4xl mb-3" />
        <p class="text-base mb-1">Aucune réponse</p>
        <p class="text-sm">
          {{ editQ.isPublished
            ? 'Partagez le lien pour commencer à collecter des retours.'
            : 'Publiez le questionnaire pour le partager.' }}
        </p>
      </div>

      <!-- Stats par question -->
      <div v-else class="space-y-6">
        <p class="text-sm text-[var(--ui-text-muted)]">
          {{ surveyStore.responses.length }} réponse{{ surveyStore.responses.length > 1 ? 's' : '' }}
        </p>

        <div
          v-for="q in editQ.questions"
          :key="q.id"
          class="rounded-[var(--ui-radius)] border border-[var(--ui-border)] bg-[var(--ui-bg)] p-4"
        >
          <div class="flex items-center gap-2 mb-4">
            <span class="text-xs px-2 py-0.5 rounded bg-[var(--ui-bg-elevated)] text-[var(--ui-text-muted)]">
              {{ typeInfo(q.type).label }}
            </span>
            <span class="text-sm font-medium">{{ q.label }}</span>
          </div>

          <!-- Rating stats -->
          <div v-if="q.type === 'rating'">
            <p class="text-2xl font-bold text-[var(--ui-primary)] mb-3">
              {{ avgRating(q.id, q.scale ?? 5) }}
              <span class="text-sm text-[var(--ui-text-muted)] font-normal">/ {{ q.scale ?? 5 }}</span>
            </p>
            <div class="space-y-1.5">
              <div
                v-for="val in Array.from({ length: q.scale ?? 5 }, (_, i) => (q.scale ?? 5) - i)"
                :key="val"
                class="flex items-center gap-2"
              >
                <span class="text-xs w-6 text-right shrink-0">{{ val }}</span>
                <div class="flex-1 h-2 rounded-full bg-[var(--ui-bg-elevated)] overflow-hidden">
                  <div
                    class="h-full rounded-full bg-[var(--ui-primary)] transition-all"
                    :style="{ width: ratingBarWidth(q.id, val) + '%' }"
                  />
                </div>
                <span class="text-xs w-5 text-[var(--ui-text-dimmed)]">{{ ratingCount(q.id, val) }}</span>
              </div>
            </div>
          </div>

          <!-- NPS stats -->
          <div v-else-if="q.type === 'nps'">
            <div class="flex gap-6 mb-4 flex-wrap">
              <div class="text-center">
                <p class="text-3xl font-bold" :class="npsScore(q.id) >= 0 ? 'text-green-600' : 'text-red-500'">
                  {{ npsScore(q.id) }}
                </p>
                <p class="text-xs text-[var(--ui-text-muted)]">Score NPS</p>
              </div>
              <div class="text-center">
                <p class="text-lg font-semibold text-green-600">{{ npsPct(q.id, 'promoters') }}%</p>
                <p class="text-xs text-[var(--ui-text-muted)]">Promoteurs (9-10)</p>
              </div>
              <div class="text-center">
                <p class="text-lg font-semibold text-yellow-500">{{ npsPct(q.id, 'passifs') }}%</p>
                <p class="text-xs text-[var(--ui-text-muted)]">Passifs (7-8)</p>
              </div>
              <div class="text-center">
                <p class="text-lg font-semibold text-red-500">{{ npsPct(q.id, 'detractors') }}%</p>
                <p class="text-xs text-[var(--ui-text-muted)]">Détracteurs (0-6)</p>
              </div>
            </div>
            <!-- Barre 0-10 -->
            <div class="flex gap-0.5">
              <div
                v-for="n in 11"
                :key="n - 1"
                class="flex-1 flex flex-col items-center gap-1"
              >
                <div
                  class="w-full rounded-sm transition-all"
                  :style="{ height: npsBarHeight(q.id, n - 1) + 'px' }"
                  :class="(n - 1) >= 9 ? 'bg-green-500' : (n - 1) >= 7 ? 'bg-yellow-400' : 'bg-red-400'"
                />
                <span class="text-xs text-[var(--ui-text-dimmed)]">{{ n - 1 }}</span>
              </div>
            </div>
          </div>

          <!-- Yes/No stats -->
          <div v-else-if="q.type === 'yes_no'" class="flex gap-4">
            <div class="flex-1 rounded-[var(--ui-radius)] bg-green-50 dark:bg-green-900/20 p-3 text-center">
              <p class="text-2xl font-bold text-green-600">{{ yesNoPct(q.id, 'yes') }}%</p>
              <p class="text-sm text-green-700 dark:text-green-400">Oui</p>
            </div>
            <div class="flex-1 rounded-[var(--ui-radius)] bg-red-50 dark:bg-red-900/20 p-3 text-center">
              <p class="text-2xl font-bold text-red-600">{{ yesNoPct(q.id, 'no') }}%</p>
              <p class="text-sm text-red-700 dark:text-red-400">Non</p>
            </div>
          </div>

          <!-- Choice stats -->
          <div v-else-if="q.type === 'single_choice' || q.type === 'multiple_choice'" class="space-y-2">
            <div v-for="opt in q.options ?? []" :key="opt" class="flex items-center gap-2">
              <span class="text-sm text-[var(--ui-text)] w-32 sm:w-48 truncate shrink-0">{{ opt }}</span>
              <div class="flex-1 h-2 rounded-full bg-[var(--ui-bg-elevated)] overflow-hidden">
                <div
                  class="h-full rounded-full bg-[var(--ui-primary)] transition-all"
                  :style="{ width: choiceBarWidth(q.id, opt) + '%' }"
                />
              </div>
              <span class="text-xs text-[var(--ui-text-dimmed)] w-6 text-right">{{ choiceCount(q.id, opt) }}</span>
            </div>
          </div>

          <!-- Text verbatims -->
          <div v-else-if="q.type === 'text_short' || q.type === 'text_long'" class="space-y-2">
            <div
              v-for="(r, i) in textVerbatims(q.id)"
              :key="i"
              class="p-3 rounded-[var(--ui-radius)] bg-[var(--ui-bg-elevated)] text-sm text-[var(--ui-text)]"
            >
              {{ r }}
            </div>
            <p v-if="!textVerbatims(q.id).length" class="text-sm text-[var(--ui-text-dimmed)]">
              Aucune réponse textuelle
            </p>
          </div>

          <!-- Cards stats -->
          <div v-else-if="q.type === 'project_cards'" class="space-y-3">
            <p v-if="!topCards(q.id).length" class="text-sm text-[var(--ui-text-dimmed)]">
              Aucune réponse
            </p>
            <div
              v-for="[cardId, count] in topCards(q.id)"
              :key="cardId"
              class="space-y-1"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm flex-1 text-[var(--ui-text-muted)] font-mono text-xs truncate">{{ cardId }}</span>
                <span class="text-sm font-medium text-[var(--ui-primary)]">{{ count }}×</span>
              </div>
              <!-- Verbatims feedback par carte -->
              <div v-if="q.withFeedback" class="pl-3 space-y-1">
                <div
                  v-for="(fb, i) in cardFeedbacks(q.id, cardId)"
                  :key="i"
                  class="text-xs italic text-[var(--ui-text-muted)] bg-[var(--ui-bg-elevated)] rounded px-2 py-1"
                >
                  « {{ fb }} »
                </div>
              </div>
            </div>
          </div>

          <!-- Materials stats -->
          <div v-else-if="q.type === 'project_materials'" class="space-y-3">
            <p v-if="!topMaterials(q.id).length" class="text-sm text-[var(--ui-text-dimmed)]">
              Aucune réponse
            </p>
            <div
              v-for="[name, count] in topMaterials(q.id)"
              :key="name"
              class="space-y-1"
            >
              <div class="flex items-center gap-2">
                <span class="text-sm flex-1">{{ name }}</span>
                <span class="text-sm font-medium text-[var(--ui-primary)]">{{ count }}×</span>
              </div>
              <!-- Verbatims feedback par matériel -->
              <div v-if="q.withFeedback" class="pl-3 space-y-1">
                <div
                  v-for="(fb, i) in materialFeedbacks(q.id, name)"
                  :key="i"
                  class="text-xs italic text-[var(--ui-text-muted)] bg-[var(--ui-bg-elevated)] rounded px-2 py-1"
                >
                  « {{ fb }} »
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useSurveyStore } from '../stores/survey.js'
import { useCardsStore } from '../stores/cards.js'
import { useConfirm } from '../composables/useConfirm.js'

const surveyStore = useSurveyStore()
const cardsStore = useCardsStore()
const { confirm } = useConfirm()

// ── Types de questions ───────────────────────────────
const QUESTION_TYPES = [
  { value: 'text_short',        label: 'Texte court' },
  { value: 'text_long',         label: 'Texte long' },
  { value: 'rating',            label: 'Note (étoiles)' },
  { value: 'nps',               label: 'NPS (0-10)' },
  { value: 'yes_no',            label: 'Oui / Non' },
  { value: 'single_choice',     label: 'Choix unique' },
  { value: 'multiple_choice',   label: 'Choix multiple' },
  { value: 'project_cards',     label: 'Cartes du projet' },
  { value: 'project_materials', label: 'Matériel du projet' },
]

function typeInfo(type) {
  return QUESTION_TYPES.find((t) => t.value === type) ?? { label: type }
}

// ── Onglets éditeur ──────────────────────────────────
const editorTabs = [
  { key: 'questions', label: 'Questions',  icon: 'i-lucide-list' },
  { key: 'responses', label: 'Réponses',   icon: 'i-lucide-bar-chart-2' },
]

// ── State ────────────────────────────────────────────
const selectedQId = ref(null)
const editorTab   = ref('questions')
const expandedQId = ref(null)
const newQuestionType = ref('text_short')
const creating    = ref(false)
const saveStatus  = ref(null)
let saveTimer     = null
let saveStatusTimer = null

// ── Computed : questionnaire en cours d'édition ──────
const editQ = computed(() =>
  surveyStore.questionnaires.find((q) => q.id === selectedQId.value) || null
)

const surveyLink = computed(() => {
  if (!editQ.value) return ''
  return `${window.location.origin}/survey/${editQ.value.token}`
})

// ── Navigation ───────────────────────────────────────
function openEditor(id) {
  selectedQId.value = id
  editorTab.value   = 'questions'
  expandedQId.value = null
}

function onTabClick(key) {
  editorTab.value = key
  if (key === 'responses') loadResponses()
}

async function loadResponses() {
  if (editQ.value) {
    await surveyStore.loadResponses(editQ.value.id)
  }
}

// ── CRUD ─────────────────────────────────────────────
async function createQ() {
  const pid = cardsStore.selectedProjectId
  if (!pid) return
  creating.value = true
  const id = await surveyStore.addQuestionnaire(pid)
  creating.value = false
  openEditor(id)
}

async function deleteQ(id) {
  const ok = await confirm({ title: 'Supprimer ce questionnaire ?', message: 'Toutes les réponses associées seront définitivement supprimées.' })
  if (!ok) return
  if (selectedQId.value === id) selectedQId.value = null
  surveyStore.deleteQuestionnaire(id)
}

// ── Sauvegarde auto ──────────────────────────────────
function scheduleSave() {
  clearTimeout(saveTimer)
  clearTimeout(saveStatusTimer)
  saveStatus.value = 'saving'
  saveTimer = setTimeout(() => {
    if (!editQ.value) return
    surveyStore.updateQuestionnaire(editQ.value.id, {
      title: editQ.value.title,
      description: editQ.value.description,
    })
    saveStatus.value = 'saved'
    saveStatusTimer = setTimeout(() => { saveStatus.value = null }, 2000)
  }, 700)
}

function scheduleSaveQ() {
  clearTimeout(saveTimer)
  clearTimeout(saveStatusTimer)
  saveStatus.value = 'saving'
  saveTimer = setTimeout(() => {
    saveQuestions()
    saveStatus.value = 'saved'
    saveStatusTimer = setTimeout(() => { saveStatus.value = null }, 2000)
  }, 700)
}

function saveQuestions() {
  if (!editQ.value) return
  surveyStore.updateQuestionnaire(editQ.value.id, {
    questions: JSON.parse(JSON.stringify(editQ.value.questions)),
  })
}

// ── Publish ──────────────────────────────────────────
function togglePublish() {
  if (!editQ.value) return
  surveyStore.updateQuestionnaire(editQ.value.id, {
    isPublished: !editQ.value.isPublished,
  })
}

function copyLink(q) {
  const link = `${window.location.origin}/survey/${q.token}`
  navigator.clipboard.writeText(link).then(() => {
    // Flash feedback (brief)
    saveStatus.value = 'saved'
    clearTimeout(saveStatusTimer)
    saveStatusTimer = setTimeout(() => { saveStatus.value = null }, 1500)
  })
}

// ── Questions ────────────────────────────────────────
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

function defaultQuestion(type) {
  const base = { id: uid(), type, label: '', required: false }
  if (type === 'rating')          return { ...base, scale: 5 }
  if (type === 'single_choice')   return { ...base, options: ['Option A', 'Option B'] }
  if (type === 'multiple_choice') return { ...base, options: ['Option A', 'Option B'] }
  if (type === 'project_cards')   return { ...base, cardTypeId: '', multiple: false }
  if (type === 'project_materials') {
    return {
      ...base,
      multiple: true,
      materialsSnapshot: cardsStore.materials.map((m) => ({ id: m.id, name: m.name, quantity: m.quantity })),
    }
  }
  return base
}

function addQuestion() {
  if (!editQ.value) return
  const q = defaultQuestion(newQuestionType.value)
  editQ.value.questions.push(q)
  expandedQId.value = q.id
  saveQuestions()
}

async function removeQuestion(idx) {
  if (!editQ.value) return
  const q = editQ.value.questions[idx]
  const ok = await confirm({ title: 'Supprimer cette question ?', message: q?.label ? `« ${q.label} »` : '' })
  if (!ok) return
  if (expandedQId.value === q?.id) expandedQId.value = null
  editQ.value.questions.splice(idx, 1)
  saveQuestions()
}

function moveQuestion(idx, dir) {
  if (!editQ.value) return
  const qs = editQ.value.questions
  const newIdx = idx + dir
  if (newIdx < 0 || newIdx >= qs.length) return
  ;[qs[idx], qs[newIdx]] = [qs[newIdx], qs[idx]]
  saveQuestions()
}

function toggleExpand(id) {
  expandedQId.value = expandedQId.value === id ? null : id
}

function onTypeChange(q) {
  // Reset type-specific fields
  delete q.scale
  delete q.options
  delete q.cardTypeId
  delete q.multiple
  delete q.materialsSnapshot

  if (q.type === 'rating')          q.scale = 5
  if (q.type === 'single_choice')   q.options = ['Option A', 'Option B']
  if (q.type === 'multiple_choice') q.options = ['Option A', 'Option B']
  if (q.type === 'project_cards')   { q.cardTypeId = ''; q.multiple = false }
  if (q.type === 'project_materials') {
    q.multiple = true
    q.materialsSnapshot = cardsStore.materials.map((m) => ({ id: m.id, name: m.name, quantity: m.quantity }))
  }
  saveQuestions()
}

function addOption(q) {
  q.options = [...(q.options ?? []), `Option ${(q.options?.length ?? 0) + 1}`]
  saveQuestions()
}

function removeOption(q, oi) {
  q.options.splice(oi, 1)
  saveQuestions()
}

function refreshMaterialsSnapshot(q) {
  q.materialsSnapshot = cardsStore.materials.map((m) => ({ id: m.id, name: m.name, quantity: m.quantity }))
  saveQuestions()
}

// ── Stats helpers ────────────────────────────────────
function answersFor(qId) {
  return surveyStore.responses.map((r) => r.answers[qId]).filter((v) => v !== undefined && v !== null && v !== '')
}

// Rating
function avgRating(qId, scale) {
  const vals = answersFor(qId).map(Number).filter((n) => !isNaN(n))
  if (!vals.length) return '—'
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1)
}

function ratingCount(qId, val) {
  return answersFor(qId).filter((v) => Number(v) === val).length
}

function ratingBarWidth(qId, val) {
  const max = Math.max(...Array.from({ length: 10 }, (_, i) => ratingCount(qId, i + 1)), 1)
  return (ratingCount(qId, val) / max) * 100
}

// NPS
function npsScore(qId) {
  const vals = answersFor(qId).map(Number).filter((n) => !isNaN(n))
  if (!vals.length) return '—'
  const promoters  = vals.filter((v) => v >= 9).length / vals.length * 100
  const detractors = vals.filter((v) => v <= 6).length / vals.length * 100
  return Math.round(promoters - detractors)
}

function npsPct(qId, group) {
  const vals = answersFor(qId).map(Number).filter((n) => !isNaN(n))
  if (!vals.length) return 0
  const counts = {
    promoters:  vals.filter((v) => v >= 9).length,
    passifs:    vals.filter((v) => v === 7 || v === 8).length,
    detractors: vals.filter((v) => v <= 6).length,
  }
  return Math.round((counts[group] / vals.length) * 100)
}

function npsBarHeight(qId, val) {
  const count = answersFor(qId).filter((v) => Number(v) === val).length
  const maxCount = Math.max(...Array.from({ length: 11 }, (_, i) => answersFor(qId).filter((v) => Number(v) === i).length), 1)
  return Math.round((count / maxCount) * 48) + 4
}

// Yes/No
function yesNoPct(qId, which) {
  const vals = answersFor(qId)
  if (!vals.length) return 0
  return Math.round(vals.filter((v) => v === which).length / vals.length * 100)
}

// Choice
function choiceCount(qId, opt) {
  let count = 0
  surveyStore.responses.forEach((r) => {
    const a = r.answers[qId]
    if (Array.isArray(a)) { if (a.includes(opt)) count++ }
    else if (a === opt) count++
  })
  return count
}

function choiceBarWidth(qId, opt) {
  const total = surveyStore.responses.length
  return total ? Math.round((choiceCount(qId, opt) / total) * 100) : 0
}

// Text
function textVerbatims(qId) {
  return answersFor(qId).filter((v) => typeof v === 'string' && v.trim())
}

// Cards
function topCards(qId) {
  const map = {}
  surveyStore.responses.forEach((r) => {
    const a = r.answers[qId]
    const ids = Array.isArray(a) ? a : (a ? [a] : [])
    ids.forEach((id) => { map[id] = (map[id] ?? 0) + 1 })
  })
  return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 10)
}

// Materials
function topMaterials(qId) {
  const map = {}
  surveyStore.responses.forEach((r) => {
    const a = r.answers[qId]
    const names = Array.isArray(a) ? a : (a ? [a] : [])
    names.forEach((name) => { map[name] = (map[name] ?? 0) + 1 })
  })
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

// Feedback verbatims par carte (clé = qId + '_feedback', valeur = { cardId: 'texte' })
function cardFeedbacks(qId, cardId) {
  return surveyStore.responses
    .map((r) => r.answers[qId + '_feedback']?.[cardId])
    .filter((v) => typeof v === 'string' && v.trim())
}

// Feedback verbatims par matériel
function materialFeedbacks(qId, matName) {
  return surveyStore.responses
    .map((r) => r.answers[qId + '_feedback']?.[matName])
    .filter((v) => typeof v === 'string' && v.trim())
}
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
