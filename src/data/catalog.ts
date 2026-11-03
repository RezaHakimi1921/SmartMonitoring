import type { Feature, FeatureCategoryId, ReviewType } from './types'

export const FEATURE_CATEGORIES: {
  id: FeatureCategoryId
  title: string
  description: string
}[] = [
  {
    id: 'performance',
    title: 'عملکرد و فروش',
    description: 'فاکتور، میانگین، اشتراک‌گیری',
  },
  {
    id: 'surveyEval',
    title: 'نظرسنجی و شکایات',
    description: 'مشارکت، شرط، پیگیری شکایت',
  },
  {
    id: 'clubSettings',
    title: 'باشگاه و تنظیمات',
    description: 'گروه، برند، ایونت، اسمارت بلاک',
  },
  {
    id: 'credit',
    title: 'اعتبار',
    description: 'مصرف اعتبار و پیشنهاد تولید',
  },
  {
    id: 'ops',
    title: 'تراز و زیرساخت',
    description: 'مشتریان، شارژ پنل، اتصال',
  },
]

export const FEATURES: Feature[] = [
  {
    id: 'overall',
    title: 'عملکرد کلی',
    description: 'میانگین و تعداد فاکتور، مشارکت نظرسنجی، رضایتمندی',
    source: 'insight',
    category: 'performance',
  },
  {
    id: 'subscription',
    title: 'اشتراک‌گیری',
    description: 'درصد ماه، میانگین ۱ سال، شیفت و نوع سفارش',
    source: 'insight',
    category: 'performance',
  },
  {
    id: 'survey',
    title: 'نظرسنجی',
    description: 'تعداد، نرخ مشارکت، شرط و درصد شروط',
    source: 'insight',
    category: 'surveyEval',
  },
  {
    id: 'complaints',
    title: 'شکایات مشتریان',
    description: 'وضعیت بررسی و پیگیری باز',
    source: 'evaluation',
    category: 'surveyEval',
  },
  {
    id: 'groups',
    title: 'گروه‌بندی مشتریان',
    description: 'وضعیت هم‌پوشانی گروه‌ها',
    source: 'club',
    category: 'clubSettings',
  },
  {
    id: 'brandSettings',
    title: 'تنظیمات برند',
    description: 'باشگاه، ارزیابی، یادآورها، حداقل مبلغ پیام',
    source: 'club',
    category: 'clubSettings',
  },
  {
    id: 'event',
    title: 'ایونت',
    description: 'تاریخ آخرین ایونت و وضعیت اطلاع‌رسانی',
    source: 'club',
    category: 'clubSettings',
  },
  {
    id: 'smartBlock',
    title: 'اسمارت بلاک',
    description: 'وضعیت و تعداد افراد بلاک',
    source: 'club',
    category: 'clubSettings',
  },
  {
    id: 'credit',
    title: 'اعتبار مشتریان',
    description: 'مشارکت در اعتبار، رفتار خرید، درصد و مدت',
    source: 'club',
    category: 'credit',
  },
  {
    id: 'creditGeneration',
    title: 'تولید اعتبار',
    description: 'پیشنهاد تغییر درصد/مدت بر اساس رفتار خرید',
    source: 'bi',
    category: 'credit',
  },
  {
    id: 'balance',
    title: 'تراز مشتریان',
    description: 'مجموع، فعال ماه/سال، از دست‌رفته، روند',
    source: 'insight',
    category: 'ops',
  },
  {
    id: 'panelCharge',
    title: 'شارژ پنل',
    description: 'روزهای بدون شارژ در بازه',
    source: 'bi',
    category: 'ops',
  },
  {
    id: 'connection',
    title: 'وضعیت اتصال',
    description: 'قطع ارتباط صندوق/اتصال',
    source: 'bi',
    category: 'ops',
  },
]

export const DEFAULT_REVIEW_TYPES: ReviewType[] = [
  {
    id: 'quick',
    title: 'بررسی سریع',
    description: 'نگاه کوتاه به شاخص‌های حیاتی',
    features: {
      overall: 'defaultOn',
      subscription: 'defaultOn',
      survey: 'defaultOn',
      panelCharge: 'defaultOn',
      complaints: 'defaultOn',
      creditGeneration: 'defaultOff',
    },
  },
  {
    id: 'first',
    title: 'بررسی اول',
    description: 'راه‌اندازی و صحت تنظیمات اولیه',
    features: {
      overall: 'defaultOn',
      subscription: 'defaultOn',
      survey: 'defaultOn',
      groups: 'defaultOn',
      brandSettings: 'defaultOn',
      balance: 'defaultOn',
      connection: 'defaultOn',
      creditGeneration: 'defaultOff',
    },
  },
  {
    id: 'after-renewal',
    title: 'تماس بعد تمدید',
    description: 'گزارش کامل پس از تمدید برای مشتری',
    features: {
      overall: 'defaultOn',
      subscription: 'defaultOn',
      survey: 'defaultOn',
      groups: 'defaultOn',
      brandSettings: 'defaultOn',
      credit: 'defaultOn',
      creditGeneration: 'defaultOn',
      event: 'defaultOn',
      smartBlock: 'defaultOn',
      balance: 'defaultOn',
      panelCharge: 'defaultOn',
      connection: 'defaultOn',
      complaints: 'defaultOn',
    },
  },
  {
    id: 'fourth',
    title: 'بررسی چهارم',
    description: 'بازبینی دوره‌ای عمیق‌تر',
    features: {
      overall: 'defaultOn',
      subscription: 'defaultOn',
      survey: 'defaultOn',
      credit: 'defaultOn',
      creditGeneration: 'defaultOn',
      balance: 'defaultOn',
      panelCharge: 'defaultOn',
      complaints: 'defaultOn',
      event: 'defaultOn',
      smartBlock: 'defaultOff',
    },
  },
]

export const SOURCE_LABEL: Record<Feature['source'], string> = {
  insight: 'اینسایت',
  club: 'کلاب‌پلاس',
  evaluation: 'ارزیابی',
  bi: 'BI',
}
