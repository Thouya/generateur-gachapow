import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

const A4_W = 210 // mm
const A4_H = 297 // mm
const MARGIN = 10 // mm

/**
 * Exporte un tableau d'éléments DOM (cartes) en un seul fichier PDF A4.
 * Grille 3x3 par défaut (9 cartes par page).
 */
export async function exportCardsToPdf(cardElements, options = {}) {
  const {
    fileName = 'cartes-gachapow.pdf',
    columns = 3,
    rows = 3,
    scale = 2,
    onProgress = null,
  } = options

  if (!cardElements.length) return

  const usableW = A4_W - 2 * MARGIN
  const usableH = A4_H - 2 * MARGIN
  const cellW = usableW / columns
  const cellH = usableH / rows
  const perPage = columns * rows

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const total = cardElements.length

  for (let i = 0; i < total; i++) {
    const el = cardElements[i]
    const imgData = await toPng(el, {
      pixelRatio: scale,
      cacheBust: true,
    })

    // Calculer les dimensions réelles de l'élément pour le ratio
    const rect = el.getBoundingClientRect()
    const aspect = rect.width / rect.height

    // Adapter la carte dans sa cellule en gardant le ratio
    let w = cellW
    let h = w / aspect
    if (h > cellH) {
      h = cellH
      w = h * aspect
    }

    const idxOnPage = i % perPage
    if (i > 0 && idxOnPage === 0) pdf.addPage()

    let x, y
    if (total === 1) {
      // Carte unique : centrée sur la page
      x = (A4_W - w) / 2
      y = (A4_H - h) / 2
    } else {
      const col = idxOnPage % columns
      const row = Math.floor(idxOnPage / columns)
      x = MARGIN + col * cellW + (cellW - w) / 2
      y = MARGIN + row * cellH + (cellH - h) / 2
    }

    pdf.addImage(imgData, 'PNG', x, y, w, h)
    if (onProgress) onProgress(i + 1, total)
  }

  pdf.save(fileName)
}
