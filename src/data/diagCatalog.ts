/** User-facing labels from SmartProjectDW.dbo.DiagType (USP_UpdateDiag). */
export type DiagCategoryId =
  | 'club'
  | 'subscription'
  | 'survey'
  | 'credit'
  | 'ops'
  | 'groups'
  | 'brand'

export type DiagItem = {
  id: number
  title: string
  hint: string
  category: DiagCategoryId
}

export const DIAG_CATEGORIES: {
  id: DiagCategoryId
  title: string
  description: string
}[] = [
  {
    id: 'club',
    title: 'باشگاه و ایونت',
    description: 'ایونت، باشگاه، بلاک',
  },
  {
    id: 'subscription',
    title: 'اشتراک‌گیری',
    description: 'نرخ عضویت از فاکتور',
  },
  {
    id: 'survey',
    title: 'نظرسنجی و ارزیابی',
    description: 'فعال بودن، مشارکت، سوالات',
  },
  {
    id: 'credit',
    title: 'اعتبار',
    description: 'تولید اعتبار و شرط‌ها',
  },
  {
    id: 'ops',
    title: 'اتصال و شارژ',
    description: 'قطع ارتباط، شارژ، فاکتور',
  },
  {
    id: 'groups',
    title: 'گروه‌بندی',
    description: 'RFM، هم‌پوشانی، قفل',
  },
  {
    id: 'brand',
    title: 'تنظیمات برند',
    description: 'لوگو، شماره، یادآور، اعلان',
  },
]

export const DIAG_ITEMS: DiagItem[] = [
  { id: 1, title: 'آخرین ایونت', hint: 'اگر ایونت خیلی قدیمی باشد هشدار می‌دهد', category: 'club' },
  { id: 2, title: 'درصد اشتراک‌گیری', hint: 'اشتراک‌گیری پایین‌تر از حد انتظار', category: 'subscription' },
  { id: 3, title: 'شارژ پیامک', hint: 'شارژ کم یا روزهای بدون شارژ', category: 'ops' },
  { id: 4, title: 'شرکت در نظرسنجی', hint: 'چند روز بدون پاسخ نظرسنجی', category: 'survey' },
  { id: 5, title: 'متولی اجرا', hint: 'متولی برای ارزیابی تعریف نشده', category: 'brand' },
  { id: 6, title: 'گروه‌بندی مشتریان', hint: 'تمرکز زیاد مشتریان در یک گروه', category: 'groups' },
  { id: 7, title: 'تغییرات گروه‌بندی', hint: 'تغییر غیرعادی در گروه‌ها', category: 'groups' },
  { id: 8, title: 'تولید اعتبار', hint: 'در روزهای اخیر اعتبار ساخته نشده', category: 'credit' },
  { id: 9, title: 'قطع ارتباط', hint: 'ارسال فاکتور قطع یا عقب‌افتاده', category: 'ops' },
  { id: 10, title: 'فعال بودن نظرسنجی', hint: 'نظرسنجی خاموش است', category: 'survey' },
  { id: 11, title: 'حداقل مبلغ نظرسنجی', hint: 'حداقل مبلغ ارسال پیام صفر است', category: 'survey' },
  { id: 12, title: 'نظرسنجی نوع سفارش', hint: 'برای بعضی سفارش‌ها نظرسنجی روشن نیست', category: 'survey' },
  { id: 13, title: 'اعلان‌های مدیر', hint: 'اعلان شارژ/قطع/لایسنس برای مدیر نیست', category: 'brand' },
  { id: 14, title: 'محصولات نظرسنجی', hint: 'محصولی برای نظرسنجی انتخاب نشده', category: 'survey' },
  { id: 15, title: 'سوالات مهم', hint: 'کیفیت غذا یا انتقادات خاموش است', category: 'survey' },
  { id: 16, title: 'لوگو', hint: 'لوگوی مجموعه تنظیم نشده', category: 'brand' },
  { id: 17, title: 'پاسخ بعد از پیامک', hint: 'پیامک رفته ولی مشارکتی نبوده', category: 'survey' },
  { id: 18, title: 'شماره تماس برند', hint: 'شماره تماس در تنظیمات نیست', category: 'brand' },
  { id: 19, title: 'یادآور انقضا', hint: 'یادآور انقضای اعتبار خاموش است', category: 'brand' },
  { id: 20, title: 'لیست بلاک مشتریان', hint: 'تعداد افراد در لیست بلاک', category: 'club' },
  { id: 21, title: 'کاهش خودکار گروه', hint: 'کاهش خودکار بعضی گروه‌ها خاموش است', category: 'groups' },
  { id: 22, title: 'گروه غیرفعال', hint: 'گروه با تنظیمات، غیرفعال مانده', category: 'groups' },
  { id: 23, title: 'هم‌پوشانی گروه', hint: 'بازه گروه‌ها با هم تداخل دارد', category: 'groups' },
  { id: 24, title: 'مشتریان قفل‌شده', hint: 'نسبت بالای مشتری در گروه قفل', category: 'groups' },
  { id: 25, title: 'حداقل خرید و میانگین', hint: 'حداقل خرید بالاتر از میانگین فاکتور است', category: 'groups' },
  { id: 26, title: 'گروه بدون شرط', hint: 'گروه خودکار شرط روشنی ندارد', category: 'groups' },
  { id: 27, title: 'شرط نوع سفارش', hint: 'برای نوع سفارش فعال، شرطی نیست', category: 'credit' },
  { id: 28, title: 'شرط بدون گروه', hint: 'شرط فعال به گروهی وصل نیست', category: 'credit' },
  { id: 29, title: 'شرط بدون پروفایل', hint: 'شرط فعال پروفایل مشتری ندارد', category: 'credit' },
  { id: 30, title: 'شرط بدون تولید اعتبار', hint: 'شرط در هفته اخیر اعتبار نساخته', category: 'credit' },
  { id: 31, title: 'تخفیف لحظه‌ای گروه', hint: 'در گروه درصد تخفیف لحظه‌ای هست', category: 'groups' },
  { id: 32, title: 'متن پیام شرط', hint: 'اطلاعات مهم در متن پیام کم است', category: 'credit' },
  { id: 33, title: 'وضعیت باشگاه', hint: 'باشگاه یا همه شروط خاموش است', category: 'club' },
  { id: 34, title: 'فاکتور ناقص', hint: 'فاکتور بدون ریز یا بدون محصول', category: 'ops' },
  { id: 35, title: 'نقطه قوت و ضعف', hint: 'سوال فعال بدون نقطه قوت یا ضعف', category: 'survey' },
  { id: 36, title: 'رسیدن پیامک', hint: 'درصد رسیدن پیامک پایین است', category: 'ops' },
  { id: 38, title: 'لیست پیک ناقص', hint: 'پیک بعضی سفارش‌های ارسال نیامده', category: 'ops' },
  { id: 39, title: 'ارسال بدون پیک', hint: 'سفارش ارسالی بدون پیک ثبت شده', category: 'ops' },
  { id: 40, title: 'روز بدون سفارش', hint: 'در بازه اخیر روزهایی بدون سفارش بوده', category: 'ops' },
]

/** نکات پیگیری که به‌صورت پیش‌فرض در گزارش هستند */
export const DEFAULT_DIAG_IDS = DIAG_ITEMS.slice(0, 8).map((d) => d.id)
