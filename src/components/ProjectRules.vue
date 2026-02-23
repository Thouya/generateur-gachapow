<template>
  <div class="rules-editor-root">
    <!-- Toolbar -->
    <div class="flex flex-wrap items-center justify-between gap-2 mb-2">
      <div v-if="editor" class="flex items-center gap-0.5 flex-wrap">
        <button
          v-for="item in toolbarItems"
          :key="item.label"
          class="px-2 py-1 rounded text-xs font-medium transition-colors"
          :class="[
            item.separator
              ? 'pointer-events-none text-[var(--ui-border)] cursor-default px-1'
              : item.active()
                ? 'bg-[var(--ui-primary)] text-white'
                : 'text-[var(--ui-text-muted)] hover:bg-[var(--ui-bg-elevated)] hover:text-[var(--ui-text)]'
          ]"
          :title="item.title"
          @mousedown.prevent="item.action && item.action()"
        >
          <span v-html="item.label" />
        </button>
      </div>

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

    <!-- Éditeur -->
    <EditorContent :editor="editor" class="rules-editor" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import { useCardsStore } from '../stores/cards.js'

const store = useCardsStore()

const saveStatus = ref(null)
let saveTimer = null
let statusTimer = null
let skipNextUpdate = false

const editor = useEditor({
  extensions: [
    StarterKit,
    Placeholder.configure({
      placeholder: 'Commence à écrire les règles de ton jeu…',
    }),
    Markdown.configure({
      transformPastedText: true,
      transformCopiedText: true,
    }),
  ],
  editorProps: {
    attributes: {
      class: 'rules-prosemirror',
      spellcheck: 'true',
    },
  },
  onUpdate({ editor }) {
    if (skipNextUpdate) return
    const md = editor.storage.markdown.getMarkdown()
    scheduleSave(md)
  },
})

function loadContent(md) {
  if (!editor.value) return
  skipNextUpdate = true
  editor.value.commands.setContent(md || '')
  skipNextUpdate = false
}

onMounted(() => {
  loadContent(store.selectedProject?.rules ?? '')
})

onBeforeUnmount(() => {
  clearTimeout(saveTimer)
  clearTimeout(statusTimer)
})

watch(
  () => store.selectedProject?.id,
  () => { loadContent(store.selectedProject?.rules ?? '') }
)

function scheduleSave(md) {
  if (!store.selectedProject) return
  clearTimeout(saveTimer)
  clearTimeout(statusTimer)
  saveStatus.value = 'saving'

  saveTimer = setTimeout(() => {
    store.updateProjectRules(store.selectedProject.id, md)
    saveStatus.value = 'saved'
    statusTimer = setTimeout(() => { saveStatus.value = null }, 2000)
  }, 800)
}

const toolbarItems = computed(() => {
  const e = editor.value
  if (!e) return []
  return [
    {
      label: '<strong>G</strong>',
      title: 'Gras (Ctrl+B)',
      action: () => e.chain().focus().toggleBold().run(),
      active: () => e.isActive('bold'),
    },
    {
      label: '<em>I</em>',
      title: 'Italique (Ctrl+I)',
      action: () => e.chain().focus().toggleItalic().run(),
      active: () => e.isActive('italic'),
    },
    {
      label: '<s>S</s>',
      title: 'Barré',
      action: () => e.chain().focus().toggleStrike().run(),
      active: () => e.isActive('strike'),
    },
    { label: '|', separator: true, active: () => false },
    {
      label: 'H1',
      title: 'Titre 1 (# espace)',
      action: () => e.chain().focus().toggleHeading({ level: 1 }).run(),
      active: () => e.isActive('heading', { level: 1 }),
    },
    {
      label: 'H2',
      title: 'Titre 2 (## espace)',
      action: () => e.chain().focus().toggleHeading({ level: 2 }).run(),
      active: () => e.isActive('heading', { level: 2 }),
    },
    {
      label: 'H3',
      title: 'Titre 3 (### espace)',
      action: () => e.chain().focus().toggleHeading({ level: 3 }).run(),
      active: () => e.isActive('heading', { level: 3 }),
    },
    { label: '|', separator: true, active: () => false },
    {
      label: '≡',
      title: 'Liste à puces (- espace)',
      action: () => e.chain().focus().toggleBulletList().run(),
      active: () => e.isActive('bulletList'),
    },
    {
      label: '1.',
      title: 'Liste numérotée (1. espace)',
      action: () => e.chain().focus().toggleOrderedList().run(),
      active: () => e.isActive('orderedList'),
    },
    {
      label: '❝',
      title: 'Citation (> espace)',
      action: () => e.chain().focus().toggleBlockquote().run(),
      active: () => e.isActive('blockquote'),
    },
    {
      label: '<code style="font-size:10px">{ }</code>',
      title: 'Code',
      action: () => e.chain().focus().toggleCode().run(),
      active: () => e.isActive('code'),
    },
  ]
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>

<style>
.rules-prosemirror {
  outline: none;
  min-height: calc(100vh - 220px);
  padding: 0.25rem 0 3rem;
  font-size: 0.9375rem;
  line-height: 1.75;
  color: var(--ui-text);
  caret-color: var(--ui-primary);
}

.rules-prosemirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  color: var(--ui-text-dimmed);
  pointer-events: none;
  height: 0;
}

.rules-prosemirror h1 {
  font-size: 1.875rem;
  font-weight: 700;
  line-height: 1.2;
  margin-top: 1.75rem;
  margin-bottom: 0.5rem;
  color: var(--ui-text);
}
.rules-prosemirror h1:first-child { margin-top: 0; }

.rules-prosemirror h2 {
  font-size: 1.375rem;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 1.5rem;
  margin-bottom: 0.375rem;
  color: var(--ui-text);
}

.rules-prosemirror h3 {
  font-size: 1.125rem;
  font-weight: 600;
  line-height: 1.4;
  margin-top: 1.25rem;
  margin-bottom: 0.25rem;
  color: var(--ui-text);
}

.rules-prosemirror p { margin-bottom: 0.375rem; }

.rules-prosemirror strong { font-weight: 700; }
.rules-prosemirror em { font-style: italic; }
.rules-prosemirror s { text-decoration: line-through; color: var(--ui-text-muted); }

.rules-prosemirror ul,
.rules-prosemirror ol {
  padding-left: 1.5rem;
  margin-bottom: 0.5rem;
}
.rules-prosemirror ul { list-style-type: disc; }
.rules-prosemirror ol { list-style-type: decimal; }
.rules-prosemirror li { margin-bottom: 0.1rem; }
.rules-prosemirror li p { margin-bottom: 0; }

.rules-prosemirror blockquote {
  border-left: 3px solid var(--ui-primary);
  padding-left: 1rem;
  margin: 0.75rem 0;
  color: var(--ui-text-muted);
  font-style: italic;
}
.rules-prosemirror blockquote p { margin-bottom: 0; }

.rules-prosemirror code {
  font-family: ui-monospace, 'Cascadia Code', monospace;
  font-size: 0.82em;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 3px;
  padding: 0.1em 0.35em;
  color: var(--ui-primary);
}

.rules-prosemirror pre {
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  padding: 0.875rem 1rem;
  margin: 0.75rem 0;
  overflow-x: auto;
}
.rules-prosemirror pre code {
  background: none;
  border: none;
  padding: 0;
  font-size: 0.85rem;
  color: var(--ui-text);
}

.rules-prosemirror hr {
  border: none;
  border-top: 1px solid var(--ui-border);
  margin: 1.5rem 0;
}

.rules-prosemirror ::selection {
  background: color-mix(in srgb, var(--ui-primary) 20%, transparent);
}
</style>
