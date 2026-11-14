export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'nodata'

export type Brand = {
  id: string
  name: string
  branch: string
  initials: string
  tint: string
  ink: string
}

export type Template = {
  id: string
  title: string
  description: string
  sections: number
  minutes: number
  accent: string
  iconBg: string
  icon: 'spark' | 'check' | 'clock'
  recommended?: boolean
  featureIds: string[]
}

export type Period = { id: string; label: string }

export type Metric = { label: string; value: string; tone: Tone }
export type Hint = { text: string; tone: Tone }
export type Section = {
  id: string
  title: string
  score: number
  metrics: Metric[]
  hints: Hint[]
}

export type DiagItem = {
  id: number
  title: string
  done: boolean
  note?: string
}

export type InboxReport = {
  id: string
  brand: string
  template: string
  period: string
  owner: string
  updated: string
  stage: string
  score: number
}

export type FeedbackItem = {
  id: string
  title: string
  type: 'bug' | 'idea'
  status: string
  when: string
  brand: string
  body: string
}

export const BRANDS: Brand[] = [
  {
    id: 'azadi',
    name: 'اسمارت سنتر آزادی',
    branch: 'تهران - شعبه آزادی',
    initials: 'آز',
    tint: '#d7ef8a',
    ink: '#4e6300',
  },
  {
    id: 'saadat',
    name: 'اسمارت سنتر سعادت‌آباد',
    branch: 'تهران - سعادت‌آباد',
    initials: 'سع',
    tint: '#f3d9b0',
    ink: '#8a5a12',
  },
  {
    id: 'arya',
    name: 'مجموعه آریا',
    branch: 'اصفهان - مرکز آریا',
    initials: 'آر',
    tint: '#f8c9d8',
    ink: '#9d174d',
  },
  {
    id: 'vanak',
    name: 'اسمارت سنتر ونک',
    branch: 'تهران - ونک',
    initials: 'ون',
    tint: '#c9e7e2',
    ink: '#0f766e',
  },
]

/** Exact Figma Make template cards (3) */
export const TEMPLATES: Template[] = [
  {
    id: 'quick',
    title: 'بررسی سریع',
    description: 'نمای کلی وضعیت مجموعه و شاخص‌های ضروری',
    sections: 5,
    minutes: 3,
    accent: '#668100',
    iconBg: '#e8f2c4',
    icon: 'spark',
    recommended: true,
    featureIds: [
      'overall',
      'subscription',
      'survey',
      'panelCharge',
      'connection',
    ],
  },
  {
    id: 'delivery',
    title: 'پس از تحویل',
    description: 'کیفیت تحویل، آموزش و تجربه شروع مشتری',
    sections: 8,
    minutes: 6,
    accent: '#668100',
    iconBg: '#e8f2c4',
    icon: 'check',
    featureIds: [
      'overall',
      'subscription',
      'survey',
      'groups',
      'brandSettings',
      'balance',
      'connection',
      'event',
    ],
  },
  {
    id: 'renewal',
    title: 'تماس بعد از تمدید',
    description: 'رضایت از تمدید، پشتیبانی و عملکرد سرویس',
    sections: 6,
    minutes: 4,
    accent: '#668100',
    iconBg: '#e8f2c4',
    icon: 'clock',
    featureIds: [
      'overall',
      'subscription',
      'survey',
      'credit',
      'panelCharge',
      'connection',
    ],
  },
]

export const PERIODS: Period[] = [
  { id: 'today', label: 'امروز' },
  { id: '7d', label: '۷ روز گذشته' },
  { id: '30d', label: '۳۰ روز گذشته' },
  { id: 'custom', label: 'بازه دلخواه' },
]

/** Figma report summary KPI tiles */
export const REPORT_KPIS = [
  {
    id: 'satisfaction',
    label: 'رضایت مشتریان',
    value: '۸۶٪',
    detail: '۴٪ رشد',
    tone: 'ok' as Tone,
    icon: 'check' as const,
  },
  {
    id: 'subscription',
    label: 'وضعیت اشتراک',
    value: '۹۲٪',
    detail: 'عالی',
    tone: 'ok' as Tone,
    icon: 'check' as const,
  },
  {
    id: 'connection',
    label: 'کیفیت اتصال',
    value: '۷۴٪',
    detail: 'قابل بهبود',
    tone: 'warn' as Tone,
    icon: 'trend' as const,
  },
  {
    id: 'charge',
    label: 'شارژ و اعتبار',
    value: '۶۸٪',
    detail: 'نیازمند توجه',
    tone: 'bad' as Tone,
    icon: 'trend' as const,
  },
]

export const REPORT_SUMMARY = {
  score: 82,
  badge: 'وضعیت خوب',
  title: 'عملکرد مجموعه پایدار است',
  body: 'امتیاز کلی نسبت به بازه قبل ۶ واحد رشد داشته. اتصال و شارژ دو موضوع اصلی پیگیری هستند.',
  growth: '۶ امتیاز رشد',
  customers: '۱۴۸ مشتری',
  aiTitle: 'جمع‌بندی دیدبان',
  aiBody:
    'رضایت کلی بالاست، اما ۱۱ مشتری قطع اتصال و ۷ مشتری مشکل شارژ گزارش کرده‌اند. پیشنهاد می‌شود امروز همین دو گروه پیگیری شوند.',
}

const SECTION_BANK: Record<string, Omit<Section, 'id'>> = {
  overall: {
    title: 'عملکرد کلی',
    score: 86,
    metrics: [
      { label: 'رضایتمندی کلی', value: '۸۶٪', tone: 'ok' },
      { label: 'روند هفته', value: '+۴٪', tone: 'ok' },
    ],
    hints: [{ text: 'رضایت در بازهٔ انتخابی پایدار است', tone: 'ok' }],
  },
  subscription: {
    title: 'اشتراک‌گیری',
    score: 92,
    metrics: [
      { label: 'درصد اشتراک‌گیری', value: '۹۲٪', tone: 'ok' },
      { label: 'وضعیت', value: 'عالی', tone: 'ok' },
    ],
    hints: [{ text: 'وضعیت اشتراک عالی است', tone: 'ok' }],
  },
  survey: {
    title: 'نظرسنجی',
    score: 78,
    metrics: [
      { label: 'نرخ پاسخ', value: '۳۴٪', tone: 'ok' },
      { label: 'فعال بودن', value: 'فعال', tone: 'ok' },
    ],
    hints: [{ text: 'نظرسنجی روشن است', tone: 'ok' }],
  },
  balance: {
    title: 'تراز مشتریان',
    score: 55,
    metrics: [
      { label: 'تراز منفی', value: '۱۸', tone: 'bad' },
    ],
    hints: [{ text: '۱۸ مشتری تراز منفی دارند', tone: 'bad' }],
  },
  panelCharge: {
    title: 'شارژ و اعتبار',
    score: 68,
    metrics: [
      { label: 'وضعیت شارژ', value: '۶۸٪', tone: 'bad' },
    ],
    hints: [{ text: '۷ مشتری مشکل شارژ گزارش کرده‌اند', tone: 'bad' }],
  },
  complaints: {
    title: 'شکایات',
    score: 70,
    metrics: [{ label: 'شکایت باز', value: '۳', tone: 'warn' }],
    hints: [{ text: '۳ شکایت باز', tone: 'warn' }],
  },
  connection: {
    title: 'کیفیت اتصال',
    score: 74,
    metrics: [{ label: 'کیفیت اتصال', value: '۷۴٪', tone: 'warn' }],
    hints: [{ text: '۱۱ مشتری قطع اتصال گزارش کرده‌اند', tone: 'warn' }],
  },
  credit: {
    title: 'اعتبار مشتریان',
    score: 68,
    metrics: [{ label: 'مصرف', value: '۴٫۱ م', tone: 'warn' }],
    hints: [{ text: 'اعتبار در آستانهٔ انقضا', tone: 'warn' }],
  },
  groups: {
    title: 'گروه‌بندی',
    score: 80,
    metrics: [{ label: 'گروه فعال', value: '۶', tone: 'ok' }],
    hints: [],
  },
  brandSettings: {
    title: 'تنظیمات برند',
    score: 88,
    metrics: [{ label: 'وضعیت', value: 'کامل', tone: 'ok' }],
    hints: [],
  },
  event: {
    title: 'ایونت',
    score: 64,
    metrics: [{ label: 'مشارکت', value: '۱۹٪', tone: 'warn' }],
    hints: [],
  },
}

export function sectionsForTemplate(templateId: string): Section[] {
  const t = TEMPLATES.find((x) => x.id === templateId) ?? TEMPLATES[0]!
  return t.featureIds.map((id) => {
    const bank = SECTION_BANK[id] ?? {
      title: id,
      score: 70,
      metrics: [{ label: 'وضعیت', value: 'دمو', tone: 'info' as Tone }],
      hints: [],
    }
    return { id, ...bank }
  })
}

export const DIAG_ITEMS: DiagItem[] = [
  {
    id: 1,
    title: 'پیگیری ۱۱ مشتری با قطع اتصال',
    done: false,
    note: 'اولویت امروز',
  },
  {
    id: 2,
    title: 'پیگیری ۷ مشتری با مشکل شارژ',
    done: false,
    note: 'اولویت امروز',
  },
  { id: 3, title: 'نظرسنجی صندوق فعال باشد', done: true },
  { id: 4, title: 'اتصال صندوق پایدار باشد', done: true },
  { id: 5, title: 'یادآوری اعتبارهای در آستانهٔ انقضا', done: false },
]

export const INBOX: InboxReport[] = [
  {
    id: 'R-1024',
    brand: 'اسمارت سنتر آزادی',
    template: 'بررسی سریع',
    period: '۷ روز گذشته',
    owner: 'رضا حکیمی',
    updated: 'همین حالا',
    stage: 'خلاصه گزارش',
    score: 82,
  },
  {
    id: 'R-1021',
    brand: 'اسمارت سنتر ونک',
    template: 'تماس بعد از تمدید',
    period: '۳۰ روز گذشته',
    owner: 'سارا محمدی',
    updated: 'دیروز ۱۶:۲۰',
    stage: 'نکات پیگیری',
    score: 64,
  },
  {
    id: 'R-1018',
    brand: 'مجموعه آریا',
    template: 'پس از تحویل',
    period: '۷ روز گذشته',
    owner: 'رضا حکیمی',
    updated: '۲ روز قبل',
    stage: 'ارسال گزارش',
    score: 71,
  },
]

export const FEEDBACK: FeedbackItem[] = [
  {
    id: 'FB-4DF3A5',
    title: 'تقویم بازه در کارت بریده می‌شود',
    type: 'bug',
    status: 'باز',
    when: 'امروز · ۱۰:۱۲',
    brand: 'آزادی',
    body: 'وقتی بازه دلخواه را باز می‌کنم، تقویم از پایین کارت بیرون می‌زند.',
  },
  {
    id: 'FB-903323',
    title: 'درصد اشتراک با اینسایت یکی نیست',
    type: 'bug',
    status: 'در حال بررسی',
    when: 'دیروز · ۱۸:۴۰',
    brand: 'ونک',
    body: 'عدد اشتراک در گزارش با پنل اینسایت اختلاف دارد.',
  },
  {
    id: 'FB-C7CDAC',
    title: 'افزودن فیلتر مرحله در صندوق گزارش',
    type: 'idea',
    status: 'پیشنهاد',
    when: '۳ روز قبل',
    brand: 'عمومی',
    body: 'می‌خواهم گزارش‌ها را بر اساس مرحله فیلتر کنم.',
  },
]

export function toFa(n: number | string) {
  return String(n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!)
}

export function toneLabel(t: Tone) {
  if (t === 'ok') return 'خوب'
  if (t === 'warn') return 'قابل بهبود'
  if (t === 'bad') return 'نیاز به اقدام'
  if (t === 'nodata') return 'بدون داده'
  return 'اطلاعات'
}
