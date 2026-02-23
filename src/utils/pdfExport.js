import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

const A4_W = 210  // mm
const A4_H = 297  // mm
const CARD_W = 63 // mm — taille standard carte TCG/poker
const CARD_H = 88 // mm

// Grille calculée à partir des dimensions fixes de la carte
const COLS = Math.floor(A4_W / CARD_W)         // 3
const ROWS_PER_PAGE = Math.floor(A4_H / CARD_H) // 3

// Centrage de la grille sur la page (marges automatiques)
const START_X = (A4_W - COLS * CARD_W) / 2        // ~10.5mm
const START_Y = (A4_H - ROWS_PER_PAGE * CARD_H) / 2 // ~16.5mm

/**
 * Exporte un tableau d'éléments DOM (cartes) en un seul fichier PDF A4.
 * Chaque carte est garantie à 63×88mm (taille standard TCG).
 * La grille 3×3 est centrée sur la page pour faciliter la découpe.
 */
export async function exportCardsToPdf(cardElements, options = {}) {
  const {
    fileName = 'cartes-gachapow.pdf',
    scale = 2,
    onProgress = null,
  } = options

  if (!cardElements.length) return

  const perPage = COLS * ROWS_PER_PAGE
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const total = cardElements.length

  // Pré-rendre toutes les images avant de les placer dans le PDF
  const images = []
  for (let i = 0; i < total; i++) {
    const imgData = await toPng(cardElements[i], { pixelRatio: scale, cacheBust: true })
    images.push(imgData)
    if (onProgress) onProgress(i + 1, total)
  }

  // Carte unique : centrée sur la page
  if (total === 1) {
    const x = (A4_W - CARD_W) / 2
    const y = (A4_H - CARD_H) / 2
    pdf.addImage(images[0], 'PNG', x, y, CARD_W, CARD_H)
    pdf.save(fileName)
    return
  }

  // Plusieurs cartes : grille 3×3 serrée et centrée
  for (let i = 0; i < total; i++) {
    const idxOnPage = i % perPage
    if (i > 0 && idxOnPage === 0) pdf.addPage()

    const col = idxOnPage % COLS
    const row = Math.floor(idxOnPage / COLS)

    const x = START_X + col * CARD_W
    const y = START_Y + row * CARD_H

    pdf.addImage(images[i], 'PNG', x, y, CARD_W, CARD_H)
  }

  pdf.save(fileName)
}
