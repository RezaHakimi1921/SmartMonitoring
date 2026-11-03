import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

async function waitForFonts() {
  if (document.fonts?.ready) await document.fonts.ready
}

async function capture(el: HTMLElement) {
  await waitForFonts()
  // Force embeddable font stack for canvas export (Vazirmatn loaded in index.html).
  return toPng(el, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#f8fafc',
    style: {
      fontFamily: '"Vazirmatn", Tahoma, sans-serif',
    },
    filter: (node) => {
      if (!(node instanceof HTMLElement)) return true
      return !node.classList.contains('no-export')
    },
  })
}

export async function exportElementAsPng(el: HTMLElement, fileName: string) {
  const dataUrl = await capture(el)
  const link = document.createElement('a')
  link.download = `${fileName}.png`
  link.href = dataUrl
  link.click()
}

export async function exportElementAsPdf(el: HTMLElement, fileName: string) {
  const dataUrl = await capture(el)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('خواندن تصویر خروجی ناموفق بود'))
    img.src = dataUrl
  })

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 8
  const usableWidth = pageWidth - margin * 2
  const usableHeight = pageHeight - margin * 2

  const scale = usableWidth / img.width
  const sliceHeightPx = usableHeight / scale
  let offsetY = 0
  let page = 0

  while (offsetY < img.height) {
    if (page > 0) pdf.addPage()
    const canvas = document.createElement('canvas')
    const h = Math.min(sliceHeightPx, img.height - offsetY)
    canvas.width = img.width
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas context')
    ctx.fillStyle = '#f8fafc'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, offsetY, img.width, h, 0, 0, img.width, h)
    const slice = canvas.toDataURL('image/png')
    pdf.addImage(slice, 'PNG', margin, margin, usableWidth, h * scale)
    offsetY += h
    page += 1
  }

  pdf.save(`${fileName}.pdf`)
}
