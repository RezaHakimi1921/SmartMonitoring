# دیدبان — منبع حقیقت UI (Figma Make / figma_design)

این سند و اسکیل `didban-ui` مرجع اجباری برای هر تغییر ظاهر در SmartMonitoring هستند.
وقتی با `@smartx/design-system` تعارض داشت، **برای صفحات journey دیدبان همین سند برنده است**؛ DS فقط برای فرم‌های سنگین اختیاری است.

## هویت

| مورد | مقدار |
|------|--------|
| محصول | دیدبان · صدای مشتری اسمارت |
| جهت | RTL فارسی |
| فونت | IRANYekanX (+ FaNum برای عدد) |
| Primary | `#668100` |
| Primary قوی | `#4e6300` |
| Primary soft | `#eff9d4` / `#e8f2c4` |
| Surface | `#fafdf2` |
| Outline | `#e8ebdd` |
| متن | `#1a1c16` / muted `#5c5f52` |
| شعاع کارت | `18–24px` |
| Toast | `DidbanToast` (زیتونی، پایین وسط) |

**ممنوع:** بنفش/ایندیگو AI، تم تاریک اجباری، نام جدول/ستون SQL در UI کاربر، Toast تیرهٔ قدیمی / Snackbar خام DS برای نوتیف journey.

## شِل

- سایدبار راست (~260px) + `main` چپ
- Topbar: `دیدبان ‹ {crumb}`
- Stage سفید گرد (`border-radius: 32px`) با padding کافی تا عنوان بیرون نزند
- فایل: `AppShell.tsx` + `AppShell.module.css`

## نقشهٔ صفحات

| صفحه | مسیر | الگوی UI |
|------|------|----------|
| بررسی جدید | `/` | ویزارد ۴ مرحله — `HomePage` + CSS Module |
| گزارش | `/report/...` | ۴ استیج: خلاصه → بخش‌ها → پیگیری → ارسال — `ReportPage` |
| صندوق گزارش | `/reports` | اینباکس Didban — `ReportsDashboardPage` |
| پیشنهادات | `/feedback` | لیست+جزئیات — `Feedback*` + modules |
| راهنما / حساب | `/help` `/profile` | `DidbanPage.module.css` |
| تنظیمات بررسی | `/admin` | تب‌های شماره‌دار + کارت قالب — `AdminPage` |
| کاربران | `/users` | فرم افزودن + فهرست کارت/جدول Didban — `UsersPage` |

## الگوهای اجباری

1. **ویزارد / تب استیج:** pill با شماره دایره‌ای (مثل خلاصه گزارش)
2. **کارت انتخاب:** گرید ۲ ستونه برای نکات پیگیری؛ قالب‌ها `auto-fit minmax(220px,1fr)`
3. **خلاصه KPI:** حداکثر ۶ متریک مهم بدون نام SQL
4. **ارسال:** ستون عمودی بزرگ — ۱) پیام مشتری ۲) فرم دستیار ۳) یادداشت
5. **Toast:** فقط `DidbanToast`
6. **عنوان صفحه:** همیشه داخل `.page` با `eyebrow` + `h1` + توضیح؛ `min-width:0` و `overflow-wrap`

## فایل‌های کلیدی CSS Module

- `src/pages/HomePage.module.css`
- `src/pages/ReportPage.module.css`
- `src/pages/AdminPage.module.css`
- `src/pages/DidbanPage.module.css`
- `src/pages/ReportsInbox.module.css` / `FeedbackInbox.module.css`
- `src/components/DidbanToast.module.css`
- `src/components/AppShell.module.css`
- `src/components/make/icons.tsx`

## مرجع برنچ / دمو

- برنچ دیزاین: `figma_design` (+ مرجع Make: `Figma_Redisgn_NewCheck`, `figma-make-preview/`)
- دمو محلی: `http://127.0.0.1:5180/monitoring/`
- پرود: `http://192.168.210.196/monitoring/`
