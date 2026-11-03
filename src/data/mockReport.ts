import type { FeatureId, ReportSection } from './types'

/** Mock numbers aligned with the sample report the user shared. */
const SECTIONS: Record<FeatureId, ReportSection> = {
  overall: {
    featureId: 'overall',
    title: 'عملکرد کلی',
    metrics: [
      { label: 'تعداد سفارش', value: '۳٬۹۷۰', tone: 'info' },
      { label: 'میانگین سفارش', value: '۱۲٬۴۳۸٬۸۸۷ ریال', tone: 'info' },
      { label: 'رضایت مشتریان', value: '۴۷٫۱۴٪', tone: 'bad' },
      { label: 'نرخ مشارکت', value: '۴٫۳۱', tone: 'warn' },
    ],
    hints: [
      { text: 'پروفایل روی ۱۰٬۰۰۰ ریال ست شده', tone: 'warn' },
      { text: 'رضایتمندی زیر ۶۰٪ است و نیاز به بررسی دارد', tone: 'bad' },
    ],
  },
  subscription: {
    featureId: 'subscription',
    title: 'گزارش اشتراک‌گیری',
    metrics: [
      { label: 'مهر', value: '۹۱٫۸٪', tone: 'ok' },
      { label: 'میانگین ۱ سال', value: '۸۸٫۷۳٪', tone: 'ok' },
      { label: 'تغییر نسبت به قبل', value: '+۳٫۰۷٪', tone: 'ok' },
    ],
    rows: [
      { label: 'ناهار / حضوری', value: '۹۳٫۱٪' },
      { label: 'شام / حضوری', value: '۹۰٫۴٪' },
      { label: 'بیرون‌بر', value: '۸۷٫۲٪' },
      { label: 'اسنپ‌فود', value: '۸۵٫۹٪' },
    ],
  },
  survey: {
    featureId: 'survey',
    title: 'نظرسنجی',
    metrics: [
      { label: 'تعداد کل نظرسنجی‌ها', value: '۷۰', tone: 'info' },
      { label: 'نرخ مشارکت', value: '۴٫۳۱', tone: 'warn' },
      { label: 'شرط نظرسنجی', value: '۶۹٬۰۰۰ تومان', tone: 'info' },
      { label: 'مشارکت تعدادی شروط مهر', value: '۱۰٫۰۵٪', tone: 'warn' },
    ],
  },
  groups: {
    featureId: 'groups',
    title: 'گروه‌بندی و چیدمان',
    metrics: [{ label: 'وضعیت هم‌پوشانی', value: 'بدون تداخل مبلغی', tone: 'ok' }],
    hints: [{ text: 'گروه‌های تعدادی و مبلغی با هم هم‌پوشانی ندارند', tone: 'ok' }],
  },
  brandSettings: {
    featureId: 'brandSettings',
    title: 'تنظیمات برند و ارزیابی',
    metrics: [
      {
        label: 'حداقل مبلغ پیام نظرسنجی ارزیابی',
        value: '۵۰۰٬۰۰۰ تومان',
        tone: 'warn',
      },
      { label: 'لوگو', value: 'ندارد', tone: 'bad' },
    ],
    rows: [
      { label: 'یادآور تخفیف اعتباری', value: 'فعال' },
      { label: 'فاکتور بدهکار در محاسبه', value: 'فعال' },
      { label: 'تیک اتمام حجت', value: 'ندارد' },
    ],
    hints: [
      {
        text: 'میانگین سفارش با حداقل مبلغ پیام فاصله دارد؛ پیشنهاد بازنگری آستانه',
        tone: 'warn',
      },
    ],
  },
  credit: {
    featureId: 'credit',
    title: 'اعتبار مشتریان',
    metrics: [
      { label: 'درصد اعتبار فعلی', value: '۵٪', tone: 'info' },
      { label: 'مدت اعتبار فعلی', value: '۳۰ روز', tone: 'info' },
      { label: 'مشارکت در استفاده از اعتبار', value: '۱۸٪', tone: 'warn' },
    ],
  },
  creditGeneration: {
    featureId: 'creditGeneration',
    title: 'تولید اعتبار',
    metrics: [
      { label: 'پیشنهاد درصد', value: '۷٪', tone: 'ok' },
      { label: 'پیشنهاد مدت', value: '۴۵ روز', tone: 'ok' },
    ],
    hints: [
      {
        text: 'بر اساس رفتار خرید، افزایش درصد و مدت می‌تواند مشارکت را بالا ببرد',
        tone: 'ok',
      },
    ],
  },
  event: {
    featureId: 'event',
    title: 'ایونت',
    metrics: [{ label: 'تاریخ آخرین ایونت', value: '۰۵/۰۵/۲۰', tone: 'info' }],
    hints: [{ text: 'بازخورد ایونت / اطلاع‌رسانی بررسی شود', tone: 'warn' }],
  },
  smartBlock: {
    featureId: 'smartBlock',
    title: 'اسمارت بلاک',
    metrics: [{ label: 'تعداد', value: '۱۵ نفر', tone: 'info' }],
  },
  balance: {
    featureId: 'balance',
    title: 'تراز مشتریان',
    metrics: [
      { label: 'مجموع مشتریان', value: '۱۰٬۸۹۵', tone: 'info' },
      { label: 'فعال یک ماه اخیر', value: '۱٬۵۴۶', tone: 'info' },
      { label: 'فعال یک سال اخیر', value: '۱۰٬۸۹۵', tone: 'info' },
      { label: 'از دست‌رفته یک سال', value: '۴۱۲', tone: 'warn' },
    ],
  },
  panelCharge: {
    featureId: 'panelCharge',
    title: 'شارژ پنل',
    metrics: [{ label: 'روزهای بدون شارژ (مهر)', value: '۶ روز', tone: 'warn' }],
  },
  connection: {
    featureId: 'connection',
    title: 'وضعیت اتصال',
    metrics: [{ label: 'قطع ارتباط', value: '۲ مورد در ۳۰ روز', tone: 'warn' }],
  },
  complaints: {
    featureId: 'complaints',
    title: 'شکایات مشتریان',
    metrics: [
      {
        label: 'وضعیت تا ۱۰ آبان',
        value: '۲ جریان باز پیگیری‌نشده',
        tone: 'bad',
      },
    ],
  },
}

export function buildMockSections(featureIds: FeatureId[]): ReportSection[] {
  return featureIds.map((id) => SECTIONS[id]).filter(Boolean)
}
