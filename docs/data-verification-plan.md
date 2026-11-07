# راستی‌آزمایی داده Monitoring ↔ SmartBi / Insight

## اصل

هر شاخص فقط وقتی «درست» است که **سه منبع یک عدد بدهند** (با یک قفل و یک بازهٔ ثابت):

1. خروجی API مانیتورینگ (`/monitoring/api/report/section?...`)
2. کوئری خام روی جدول SmartBi همان فرمول Insight
3. همان عدد در UI/API اینسایت (اختیاری ولی طلایی)

اگر ۱≠۲ → باگ loader مانیتورینگ.  
اگر ۲≠۳ → یا بازه/BranchID فرق دارد یا Insight فیلتر اضافه دارد (serviceType، ماه شمسی، …).

## نمونهٔ طلایی (ثابت کن؛ عوض نکن وسط تست)

| فیلد | مقدار |
|---|---|
| لاک | `9276351` |
| BranchId کلاب / BI | `17297` |
| بازه پیشنهادی | ۱ سال اخیر شمسی (مثلاً `1404/09/01` تا امروز) |
| نوع بررسی | سریع / بعد تمدید |

## ماتریس شاخص → منبع طلایی

| شاخص مانیتورینگ | جدول SmartBi | فرمول |
|---|---|---|
| درصد اشتراک‌گیری | `SmartPowerBI.dbo.Fact_Subscription` | `SUM(memberCount) / SUM(MinFactureCount) * 100` |
| تعداد سفارش / مبلغ | `Fact_SalesSummary` | `SUM(TotalOrders)`, `SUM(InvoiceSubTotal)` |
| رضایت / پیامک نظرسنجی | `Fact_SatisfactionSummary` | `satisfiedReviews / TotalReviews`, `SmsCount` |
| ازدست‌رفته | `BI_BranchLostCustomers` | ماه‌های `YearMonth` در بازه |
| اعتبار تولید/مصرف | `BI_BranchCredit` | `GeneratedCreditSum` / `SumUsedCredit` |
| شارژ منفی / قطع | `SmartProjectDW.dbo.Fact_Branch` | روزهای NegCharge / Disconnect |

## کوئری‌های پایه (کپی و اجرا)

```sql
-- اشتراک (باید ≈ خروجی feature=subscription)
SELECT
  SUM(CAST(memberCount AS float)) AS memberCount,
  SUM(CAST(MinFactureCount AS float)) AS MinFactureCount,
  CAST(SUM(CAST(memberCount AS float))
       / NULLIF(SUM(CAST(MinFactureCount AS float)),0) * 100 AS decimal(10,2)) AS SubRatePct
FROM SmartPowerBI.dbo.Fact_Subscription WITH (NOLOCK)
WHERE BranchID = 17297
  AND DateKey BETWEEN @fromKey AND @toKey;
```

```sql
-- فروش
SELECT
  SUM(CAST(TotalOrders AS float)) AS TotalOrders,
  SUM(CAST(InvoiceSubTotal AS float)) AS Sales
FROM SmartPowerBI.dbo.Fact_SalesSummary WITH (NOLOCK)
WHERE BranchID = 17297
  AND DateKey BETWEEN @fromKey AND @toKey;
```

```sql
-- رضایت
SELECT
  SUM(CAST(TotalReviews AS float)) AS TotalReviews,
  SUM(CAST(satisfiedReviews AS float)) AS Satisfied,
  SUM(CAST(SmsCount AS float)) AS SmsCount
FROM SmartPowerBI.dbo.Fact_SatisfactionSummary WITH (NOLOCK)
WHERE BranchId = 17297
  AND DateKey BETWEEN @fromKey AND @toKey;
```

## روند کار پیشنهادی (تیم)

1. **هفتهٔ اول:** فقط لاک `9276351` — همهٔ شاخص‌های جدول بالا را سبز/قرمز کن.
2. **هفتهٔ دوم:** ۳ لاک دیگر (خوب / متوسط / ضعیف از نظر اشتراک).
3. هر باگ: در loader همان feature فیکس؛ دوباره همان کوئری؛ تا ۱=۲ شود.
4. بعد از سبز شدن، اسکریپت `deploy/verify_smartbi.py` را به چک‌لیست CI/دستی وصل کن.

## اشتباهات رایج (قبلاً دیده شد)

- خواندن از `CustomerFactureClubs` به‌جای `Fact_Subscription` → درصد جعلی ~۲٪ به‌جای ~۱۵٪
- اشتباه گرفتن `BranchId` کلاب با `SmartwifiBranchId` / لاک
- بازهٔ شمسی DateKey غلط (سال ۱۴۰۴ به‌جای ۱۲ ماه اخیر)
- مقایسه با `BranchSubscriptionResults` (اسنپ‌شات روزانه) به‌جای Fact ساعتی Insight
