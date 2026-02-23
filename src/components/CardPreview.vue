<template>
  <div class="card-preview" :style="cardStyle">
    <!-- Couche 1 : Fond de carte -->
    <img
      v-if="cardType.backgroundImage"
      :src="cardType.backgroundImage"
      class="card-layer card-layer--background"
      alt="Fond"
    />

    <!-- Couche 2 : Illustration -->
    <img
      v-if="illustrationSrc"
      :src="illustrationSrc"
      class="card-layer card-layer--illustration"
      alt="Illustration"
    />

    <!-- Couche 3 : Dessus de carte -->
    <img
      v-if="cardType.overlayImage"
      :src="cardType.overlayImage"
      class="card-layer card-layer--overlay"
      alt="Dessus"
    />

    <!-- Couche 4 : Contenu (texte / stats) -->
    <div class="card-layer card-layer--content">
      <div
        v-for="field in cardType.contentFields"
        :key="field.key"
        class="card-field"
        :style="fieldStyle(field)"
      >
        {{ formatValue(field) }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  cardType: {
    type: Object,
    required: true,
  },
  cardData: {
    type: Object,
    default: () => ({}),
  },
})

const cardStyle = computed(() => ({
  width: (props.cardType.width || 300) + 'px',
  height: (props.cardType.height || 420) + 'px',
}))

const illustrationSrc = computed(() => {
  // Priorité 1 : illustration personnalisée par carte
  if (props.cardData.__illustration) return props.cardData.__illustration
  // Priorité 2 : colonne CSV désignée
  if (props.cardType.illustrationColumn && props.cardData[props.cardType.illustrationColumn]) {
    return props.cardData[props.cardType.illustrationColumn]
  }
  // Priorité 3 : illustration par défaut du type
  return props.cardType.illustrationImage || null
})

function formatValue(field) {
  const raw = props.cardData[field.key] ?? ''
  if (field.uppercase) return String(raw).toUpperCase()
  return raw
}

function fieldStyle(field) {
  const style = {
    position: 'absolute',
    left: (field.x ?? 0) + 'px',
    top: (field.y ?? 0) + 'px',
    width: field.width ? field.width + 'px' : 'auto',
    fontSize: (field.fontSize ?? 14) + 'px',
    fontFamily: field.fontFamily || 'system-ui, sans-serif',
    color: field.color ?? '#000000',
    fontWeight: field.bold ? 'bold' : 'normal',
    fontStyle: field.italic ? 'italic' : 'normal',
    textAlign: field.align ?? 'left',
    textTransform: field.uppercase ? 'uppercase' : 'none',
  }

  if (field.height) {
    style.height = field.height + 'px'
    style.display = 'flex'
    style.alignItems =
      field.verticalAlign === 'middle' ? 'center'
      : field.verticalAlign === 'bottom' ? 'flex-end'
      : 'flex-start'
    if (field.align === 'center') style.justifyContent = 'center'
    else if (field.align === 'right') style.justifyContent = 'flex-end'
    else style.justifyContent = 'flex-start'
  }

  return style
}
</script>

<style scoped>
.card-preview {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: #e0e0e0;
  flex-shrink: 0;
  max-width: 100%;
}

.card-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.card-layer--background {
  z-index: 1;
  object-fit: cover;
}

.card-layer--illustration {
  z-index: 2;
  object-fit: contain;
}

.card-layer--overlay {
  z-index: 3;
  object-fit: cover;
  pointer-events: none;
}

.card-layer--content {
  z-index: 4;
  pointer-events: none;
}

.card-field {
  pointer-events: none;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow: hidden;
}
</style>
