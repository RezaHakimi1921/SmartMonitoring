import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'

async function waitForFonts() {
  if (document.fonts?.ready) await document.fonts.ready
  // give webfont a beat to paint
  await new Promise((r) => window.setTimeout(r, 50))
}

async function capture(el: HTMLElement) {
  await waitForFonts()
  return toPng(el, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
    width: el.scrollWidth,
    height: el.scrollHeight,
    style: {
      fontFamily: '"Vazirmatn", Tahoma, sans-serif',
      // ensure solid paint path (no transparency quirks)
      opacity: '1',
    },
  })
}

function downloadDataUrl(dataUrl: string, fileName: string) {
  const link = document.createElement('a')
  link.download = fileName
  link.href = dataUrl
  link.click()
}

export async function exportElementAsPng(el: HTMLElement, fileName: string) {
  const dataUrl = await capture(el)
  downloadDataUrl(dataUrl, `${fileName}.png`)
}

export async function exportElementAsPdf(el: HTMLElement, fileName: string) {
  const dataUrl = await capture(el)
  const img = new Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('ساخت تصویر گزارش ناموفق بود'))
    img.src = dataUrl
  })

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 10
  const usableW = pageW - margin * 2
  const usableH = pageH - margin * 2

  // Fit width; paginate vertically with whole-page slices.
  const scale = usableW / img.width
  const pageHeightPx = Math.floor(usableH / scale)
  let y = 0
  let page = 0

  while (y < img.height - 1) {
    if (page > 0) pdf.addPage()
    const sliceH = Math.min(pageHeightPx, img.height - y)
    const canvas = document.createElement('canvas')
    canvas.width = img.width
    canvas.height = Math.max(1, Math.floor(sliceH))
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('خروجی PDF در دسترس نیست')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(
      img,
      0,
      y,
      img.width,
      sliceH,
      0,
      0,
      img.width,
      sliceH,
    )
    const sliceUrl = canvas.toDataURL('image/jpeg', 0.92)
    pdf.addImage(
      sliceUrl,
      'JPEG',
      margin,
      margin,
      usableW,
      sliceH * scale,
    )
    y += sliceH
    page += 1
    if (page > 30) break
  }

  pdf.save(`${fileName}.pdf`)
}
