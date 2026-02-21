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
        {{ getFieldValue(field.key) }}
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
  // L'illustration peut venir du CSV (colonne image) ou du type de carte
  if (props.cardType.illustrationColumn && props.cardData[props.cardType.illustrationColumn]) {
    return props.cardData[props.cardType.illustrationColumn]
  }
  return props.cardType.illustrationImage || null
})

function getFieldValue(key) {
  return props.cardData[key] ?? ''
}

function fieldStyle(field) {
  return {
    position: 'absolute',
    left: (field.x ?? 0) + 'px',
    top: (field.y ?? 0) + 'px',
    width: field.width ? field.width + 'px' : 'auto',
    fontSize: (field.fontSize ?? 14) + 'px',
    color: field.color ?? '#000000',
    fontWeight: field.bold ? 'bold' : 'normal',
    textAlign: field.align ?? 'left',
  }
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
}
</style>
