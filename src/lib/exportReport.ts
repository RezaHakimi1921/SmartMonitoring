import { toJpeg } from 'html-to-image'
import { jsPDF } from 'jspdf'

const CAPTURE_OPTS = {
  cacheBust: true,
  pixelRatio: 2,
  quality: 0.92,
  backgroundColor: '#ffffff',
  style: { fontFamily: '"Vazirmatn", Tahoma, sans-serif', opacity: '1' },
}

async function waitForFonts() {
  if (document.fonts?.ready) await document.fonts.ready
  await new Promise((r) => window.setTimeout(r, 60))
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('ساخت تصویر گزارش ناموفق بود'))
    img.src = src
  })
}

type Block = { dataUrl: string; w: number; h: number }

async function captureBlock(el: HTMLElement): Promise<Block> {
  const w = el.offsetWidth
  const h = el.offsetHeight
  const dataUrl = await toJpeg(el, { ...CAPTURE_OPTS, width: w, height: h })
  return { dataUrl, w, h }
}

/**
 * PDF چندصفحه‌ای A4: هر بخش گزارش جدا گرفته می‌شود و کامل در یک صفحه
 * می‌نشیند (بخش‌ها وسط بریده نمی‌شوند). هر صفحه پاورقی و شماره صفحه دارد.
 * @param host المان خارج از صفحه که بلاک‌ها با کلاس `.pdf-block` در آن هستند
 * @param footerText متن پاورقی برای هر صفحه
 */
export async function exportReportAsPdf(
  host: HTMLElement,
  fileName: string,
  footerText: (page: number, total: number) => string,
) {
  await waitForFonts()
  const els = Array.from(host.querySelectorAll<HTMLElement>('.pdf-block'))
  if (els.length === 0) throw new Error('گزارشی برای ساخت PDF وجود ندارد')

  const blocks: Block[] = []
  for (const el of els) blocks.push(await captureBlock(el))

  const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 10
  const footerH = 10
  const gap = 3
  const usableW = pageW - margin * 2
  const bottom = pageH - margin - footerH

  // چیدن بلاک‌ها در صفحه‌ها
  const pages: { block: Block; y: number; hMm: number; wMm: number }[][] = [[]]
  let y = margin
  for (const block of blocks) {
    let wMm = usableW
    let hMm = (block.h * usableW) / block.w
    const maxH = bottom - margin
    if (hMm > maxH) {
      // بلاک خیلی بلند: کوچک می‌شود تا در یک صفحه بنشیند
      wMm = (usableW * maxH) / hMm
      hMm = maxH
    }
    if (y + hMm > bottom && pages[pages.length - 1].length > 0) {
      pages.push([])
      y = margin
    }
    pages[pages.length - 1].push({ block, y, hMm, wMm })
    y += hMm + gap
  }

  const total = pages.length
  const footerEl = document.createElement('div')
  footerEl.className = 'pdf-footer'
  host.appendChild(footerEl)
  try {
    for (let p = 0; p < total; p += 1) {
      if (p > 0) pdf.addPage()
      for (const item of pages[p]) {
        pdf.addImage(
          item.block.dataUrl,
          'JPEG',
          margin + (usableW - item.wMm) / 2,
          item.y,
          item.wMm,
          item.hMm,
        )
      }
      footerEl.textContent = footerText(p + 1, total)
      const f = await captureBlock(footerEl)
      const img = await loadImage(f.dataUrl)
      const fMm = (img.height / img.width) * usableW
      pdf.addImage(f.dataUrl, 'JPEG', margin, pageH - margin - fMm, usableW, fMm)
    }
  } finally {
    footerEl.remove()
  }

  pdf.save(`${fileName}.pdf`)
}
