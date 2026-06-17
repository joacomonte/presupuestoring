import html2canvas from 'html2canvas-pro'
import { jsPDF } from 'jspdf'

// Captura un elemento del DOM y genera un PDF A4 (paginado si es alto).
// Client-side, sin backend (PRD §4.1). html2canvas-pro soporta colores oklch (Tailwind v4).
export async function exportElementToPDF(element, filename = 'presupuesto.pdf') {
  if (!element) throw new Error('Elemento no encontrado')

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  })

  const img = canvas.toDataURL('image/jpeg', 0.95)
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()

  const imgW = pageW
  const imgH = (canvas.height * imgW) / canvas.width

  let heightLeft = imgH
  let position = 0

  pdf.addImage(img, 'JPEG', 0, position, imgW, imgH)
  heightLeft -= pageH

  while (heightLeft > 0) {
    position -= pageH
    pdf.addPage()
    pdf.addImage(img, 'JPEG', 0, position, imgW, imgH)
    heightLeft -= pageH
  }

  pdf.save(filename)
}
