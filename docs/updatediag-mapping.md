# Mapping: Monitoring features ← USP_UpdateDiag

منبع حقیقت برای تشخیص‌ها: `SmartProjectDW.dbo.USP_UpdateDiag` → `DiagReports`.
نکته: `DiagReports` فقط شعب **مشکل‌دار** را نگه می‌دارد (TRUNCATE + INSERT). برای گزارش Monitoring باید **همان کوئری محاسبه** را اجرا کنیم (نه فقط خواندن جدول هشدار).

## قابل برداشت از UpdateDiag

| Feature Monitoring | DiagType | منطق خلاصه |
|---|---|---|
| `subscription` | 2 | ۷ روز، فاکتور فروش (`ACCOUNTING_KIND=0`) با `FinanlPrice >= MinFacturePriceToCalcSubscription`؛ اشتراک = عضو با `LongMobile > 1`؛ نرخ = Sub/Total×100؛ هشدار اگر <70 |
| `event` | 1 | آخرین `BrandEvents.FireDate`؛ هشدار اگر هیچ ایونتی در ۶۰ روز اخیر نباشد |
| `panelCharge` | 3 | `Unified_Branches_Wallet.Wallet < 10000` + روز بدون شارژ از `AdminDashboards` |
| `connection` | 9 | آخرین `FACTURE.SyncTime`؛ قطع اگر فاصله ۴۸س–۹۰روز؛ لایسنس ≥۶۰روز |
| `survey` (فعال/بدون پاسخ) | 4, 10–17 | ۴: بدون پاسخ ۷روز؛ ۱۰: نظرسنجی خاموش؛ ۱۱ حداقل مبلغ؛ ۱۲ نوع سفارش؛ … |
| `groups` | 6, 7, 21–29 | RFM تمرکز / تغییر پایدار / هم‌پوشانی / قفل / شرط |
| `brandSettings` | 10–19, 33 | تنظیمات ارزیابی/باشگاه/یادآور/شماره/لوگو |
| `smartBlock` | 20 | تعداد بلاک |
| `credit` / تولید (هشدار) | 8, 30 | ۸: بدون تولید اعتبار ۷روز از `CustomerActivities`؛ ۳۰: شرط بدون تولید |

## نیاز به تعریف از کاربر (در UpdateDiag متریک پیوسته گزارش نیست)

| Feature | چرا |
|---|---|
| `overall` | میانگین فاکتور / تعداد / رضایتمندی دوره‌ای در SP نیست |
| `survey` نرخ مشارکت٪ | Type4 فقط «بدون پاسخ ۷روز» است؛ نرخ Engage/SMS یا Engage/فاکتور جداست |
| `credit` مصرف٪ / مبلغ | Type8 فقط «تولید نشده» است؛ Created/Used از Fact نیست |
| `creditGeneration` پیشنهاد درصد/مدت | فرمول پیشنهاد در SP نیست |
| `balance` تراز / ازدست‌رفته | هیچ DiagType برای Lost/Active ماه |
| `complaints` شکایات باز | در SP نیست |
