/**
 * کوئری هر شاخص کیفی — با منبع واقعی.
 * DateKey / YearMonth شمسی‌اند. @sw = SmartwifiBranchId · @branchId = Branches.Id
 * @fromKey/@toKey = YYYYMMDD شمسی · @fromYm/@toYm = YYYYMM شمسی
 */
export type MetricQueryDoc = {
  /** شناسهٔ MetricRule */
  metricId: string
  featureId: string
  title: string
  /** آیا باید از SmartPowerBI خوانده شود */
  shouldUsePowerBI: boolean
  /** منبع فعلی پیشنهادی برای نمایش/اجرا */
  source: string
  note: string
  sql: string
}

export const METRIC_QUERY_DOCS: MetricQueryDoc[] = [
  {
    metricId: 'overall_satisfaction',
    featureId: 'overall',
    title: 'رضایتمندی کلی',
    shouldUsePowerBI: true,
    source: 'SmartPowerBI.dbo.Fact_SatisfactionSummary',
    note: 'رضایت = SUM(satisfiedReviews) / SUM(TotalReviews) × ۱۰۰ روی بازه DateKey.',
    sql: `SELECT
  SUM(CAST(ISNULL(TotalReviews,0) AS float)) AS TotalReviews,
  SUM(CAST(ISNULL(satisfiedReviews,0) AS float)) AS Satisfied,
  CAST(SUM(CAST(ISNULL(satisfiedReviews,0) AS float)) AS float)
    / NULLIF(SUM(CAST(ISNULL(TotalReviews,0) AS float)), 0) * 100 AS SatisfactionPct
FROM SmartPowerBI.dbo.Fact_SatisfactionSummary WITH (NOLOCK)
WHERE BranchId = @sw
  AND DateKey BETWEEN @fromKey AND @toKey;`,
  },
  {
    metricId: 'subscription',
    featureId: 'subscription',
    title: 'درصد اشتراک‌گیری',
    shouldUsePowerBI: true,
    source: 'SmartPowerBI.dbo.Fact_Subscription',
    note: 'نرخ = SUM(memberCount) / SUM(MinFactureCount). دانه: روز×ساعت×serviceType.',
    sql: `SELECT
  SUM(CAST(ISNULL(memberCount,0) AS float)) AS memberCount,
  SUM(CAST(ISNULL(MinFactureCount,0) AS float)) AS MinFactureCount,
  CAST(SUM(CAST(ISNULL(memberCount,0) AS float)) AS float)
    / NULLIF(SUM(CAST(ISNULL(MinFactureCount,0) AS float)), 0) * 100 AS SubRatePct
FROM SmartPowerBI.dbo.Fact_Subscription WITH (NOLOCK)
WHERE BranchID = @sw
  AND DateKey BETWEEN @fromKey AND @toKey;`,
  },
  {
    metricId: 'surveyResponse',
    featureId: 'survey',
    title: 'نرخ پاسخ نظرسنجی',
    shouldUsePowerBI: true,
    source: 'SmartPowerBI.dbo.Fact_SatisfactionSummary',
    note: 'پاسخ / SMS ارسال‌شده ≈ TotalReviews / SmsCount (در صورت وجود SmsCount).',
    sql: `SELECT
  SUM(CAST(ISNULL(TotalReviews,0) AS float)) AS TotalReviews,
  SUM(CAST(ISNULL(SmsCount,0) AS float)) AS SmsCount,
  CAST(SUM(CAST(ISNULL(TotalReviews,0) AS float)) AS float)
    / NULLIF(SUM(CAST(ISNULL(SmsCount,0) AS float)), 0) * 100 AS ResponsePct
FROM SmartPowerBI.dbo.Fact_SatisfactionSummary WITH (NOLOCK)
WHERE BranchId = @sw
  AND DateKey BETWEEN @fromKey AND @toKey;`,
  },
  {
    metricId: 'surveyEngageVsOrders',
    featureId: 'survey',
    title: 'مشارکت نسبت به سفارش',
    shouldUsePowerBI: true,
    source: 'Fact_SatisfactionSummary + Fact_Subscription',
    note: 'مشارکت = TotalReviews / MinFactureCount (سفارش از Subscription مثل Insight).',
    sql: `SELECT
  (SELECT SUM(CAST(ISNULL(TotalReviews,0) AS float))
   FROM SmartPowerBI.dbo.Fact_SatisfactionSummary WITH (NOLOCK)
   WHERE BranchId = @sw AND DateKey BETWEEN @fromKey AND @toKey) AS Reviews,
  (SELECT SUM(CAST(ISNULL(MinFactureCount,0) AS float))
   FROM SmartPowerBI.dbo.Fact_Subscription WITH (NOLOCK)
   WHERE BranchID = @sw AND DateKey BETWEEN @fromKey AND @toKey) AS Orders;`,
  },
  {
    metricId: 'activeSurvey',
    featureId: 'survey',
    title: 'فعال بودن نظرسنجی',
    shouldUsePowerBI: true,
    source: 'SmartPowerBI.dbo.Fact_SatisfactionSummary',
    note: 'اگر در بازه TotalReviews یا SmsCount > 0 باشد = فعال.',
    sql: `SELECT
  SUM(CAST(ISNULL(TotalReviews,0) AS float)) AS TotalReviews,
  SUM(CAST(ISNULL(SmsCount,0) AS float)) AS SmsCount,
  CASE WHEN SUM(CAST(ISNULL(TotalReviews,0) AS float)) > 0
         OR SUM(CAST(ISNULL(SmsCount,0) AS float)) > 0
       THEN 1 ELSE 0 END AS IsActive
FROM SmartPowerBI.dbo.Fact_SatisfactionSummary WITH (NOLOCK)
WHERE BranchId = @sw
  AND DateKey BETWEEN @fromKey AND @toKey;`,
  },
  {
    metricId: 'creditUse',
    featureId: 'credit',
    title: 'مصرف اعتبار',
    shouldUsePowerBI: true,
    source: 'SmartPowerBI.dbo.BI_BranchCredit',
    note: 'مصرف ≈ UsedCreditCount / GeneratedCreditCount روی YearMonth شمسی.',
    sql: `SELECT
  SUM(ISNULL(GeneratedCreditCount,0)) AS CreatedAct,
  SUM(ISNULL(UsedCreditCount,0)) AS UsedAct,
  CAST(SUM(ISNULL(UsedCreditCount,0)) AS float)
    / NULLIF(SUM(ISNULL(GeneratedCreditCount,0)), 0) * 100 AS UsePct
FROM SmartPowerBI.dbo.BI_BranchCredit WITH (NOLOCK)
WHERE BranchID = @sw
  AND TRY_CAST(YearMonth AS int) BETWEEN @fromYm AND @toYm;`,
  },
  {
    metricId: 'credit_generation',
    featureId: 'creditGeneration',
    title: 'تولید اعتبار در ۷ روز',
    shouldUsePowerBI: true,
    source: 'SmartPowerBI.dbo.BI_BranchCredit',
    note: 'اگر GeneratedCreditCount در بازه > 0 باشد = تولید داشته.',
    sql: `SELECT
  SUM(ISNULL(GeneratedCreditCount,0)) AS CreatedAct,
  CASE WHEN SUM(ISNULL(GeneratedCreditCount,0)) > 0 THEN 1 ELSE 0 END AS HasGeneration
FROM SmartPowerBI.dbo.BI_BranchCredit WITH (NOLOCK)
WHERE BranchID = @sw
  AND TRY_CAST(YearMonth AS int) BETWEEN @fromYm AND @toYm;`,
  },
  {
    metricId: 'lostRate',
    featureId: 'balance',
    title: 'نرخ ازدست‌رفته',
    shouldUsePowerBI: true,
    source: 'SmartPowerBI.dbo.BI_BranchLostCustomers',
    note: 'جمع CustomerLost در بازه / CustomerInLastYear آخرین ماه.',
    sql: `SELECT
  SUM(ISNULL(CustomerLost,0)) AS LostSum,
  (SELECT TOP 1 CustomerInLastYear
   FROM SmartPowerBI.dbo.BI_BranchLostCustomers WITH (NOLOCK)
   WHERE Branchid = @sw
     AND TRY_CAST(YearMonth AS int) BETWEEN @fromYm AND @toYm
   ORDER BY YearMonth DESC) AS CustomersYear
FROM SmartPowerBI.dbo.BI_BranchLostCustomers WITH (NOLOCK)
WHERE Branchid = @sw
  AND TRY_CAST(YearMonth AS int) BETWEEN @fromYm AND @toYm;`,
  },
  {
    metricId: 'negChargeDays',
    featureId: 'panelCharge',
    title: 'روز بدون شارژ',
    shouldUsePowerBI: true,
    source: 'SmartPowerBI.dbo.V_BI_BranchSmsCharge',
    note:
      'منبع درست Insight: SUM(CountDayWithoutCharge) ماهانه. قبلاً اشتباه از Fact_Branch.DW خوانده می‌شد.',
    sql: `SELECT
  SUM(ISNULL(CountDayWithoutCharge,0)) AS NegChargeDays,
  COUNT(*) AS MonthRows
FROM SmartPowerBI.dbo.V_BI_BranchSmsCharge WITH (NOLOCK)
WHERE BranchID = @sw
  AND TRY_CAST(YearMonth AS int) BETWEEN @fromYm AND @toYm;`,
  },
  {
    metricId: 'disconnectDays',
    featureId: 'connection',
    title: 'روز قطع ارتباط',
    shouldUsePowerBI: false,
    source: 'SmartProjectDW.dbo.Fact_Branch',
    note:
      'معادل PowerBI برای قطع ارتباط نیست؛ همان منبع مانیتور عملیات (HowManydaysDisconnected). تعداد روز با مقدار > 0.',
    sql: `SELECT
  SUM(CASE WHEN ISNULL(HowManydaysDisconnected,0) > 0 THEN 1 ELSE 0 END) AS DisconnectDays,
  COUNT(*) AS DayCount
FROM SmartProjectDW.dbo.Fact_Branch WITH (NOLOCK)
WHERE BranchKey IN (@sw, @branchId)
  AND DateKey BETWEEN @fromKey AND @toKey;`,
  },
  {
    metricId: 'complaints_open',
    featureId: 'complaints',
    title: 'شکایت باز',
    shouldUsePowerBI: false,
    source: 'SmartProjectDW.dbo.PBI_SurveyFlows (+ DiagReports)',
    note: 'جریان‌های باز نظرسنجی / شکایت — دادهٔ عملیاتی DW، نه KPI ماهانهٔ PowerBI.',
    sql: `SELECT COUNT(*) AS OpenFlows
FROM SmartProjectDW.dbo.PBI_SurveyFlows f WITH (NOLOCK)
INNER JOIN SmartProjectDW.dbo.PBI_SurveyForms sf WITH (NOLOCK)
  ON sf.SurveyFormId = f.SurveyFormId
WHERE sf.BranchID IN (@branchId, @sw)
  AND f.SurveyFlowStatusId IN (1,2,3)
  AND f.StartDate >= DATEADD(day, -90, GETDATE());`,
  },
  {
    metricId: 'groups_overlap',
    featureId: 'groups',
    title: 'هم‌پوشانی گروه',
    shouldUsePowerBI: false,
    source: 'SmartwifiCustomerClub.dbo.ClubGroups',
    note: 'تنظیمات زندهٔ باشگاه — باید از کلاب خوانده شود، نه PowerBI.',
    sql: `SELECT Id, Name, Active, MinTotalShopping, MaxTotalShopping, CustomerCount
FROM SmartwifiCustomerClub.dbo.ClubGroups WITH (NOLOCK)
WHERE BranchId = @branchId AND ISNULL(Deleted,0)=0
ORDER BY [Order];`,
  },
  {
    metricId: 'clubActive',
    featureId: 'brandSettings',
    title: 'وضعیت باشگاه',
    shouldUsePowerBI: false,
    source: 'SmartProjectDW.dbo.DiagReports',
    note: 'هشدارهای تنظیمات (DiagType) از DW — PowerBI KPI ماهانه ندارد.',
    sql: `SELECT TOP 20 d.DiagType, d.Value, RTRIM(t.Fa_TypeName) AS title
FROM SmartProjectDW.dbo.DiagReports d WITH (NOLOCK)
LEFT JOIN SmartProjectDW.dbo.DiagType t ON t.TypeID = d.DiagType
WHERE d.Smartwifibranchid IN (@branchId, @sw)
  AND ISNULL(d.IsDeleted,0)=0 AND d.IsDiage = 1
  AND d.DiagType IN (10,11,13,16,18,19,33)
ORDER BY d.DateTime DESC;`,
  },
  {
    metricId: 'event_recent',
    featureId: 'event',
    title: 'روز از آخرین ایونت',
    shouldUsePowerBI: false,
    source: 'SmartwifiCustomerClub.dbo.BrandEvents',
    note: 'ایونت زندهٔ کلاب — منبع PowerBI نیست.',
    sql: `SELECT TOP 5 Id, Name, FireDate, Fired, CreationTime
FROM SmartwifiCustomerClub.dbo.BrandEvents WITH (NOLOCK)
WHERE BrandId = @brandId AND ISNULL(Deleted,0)=0
ORDER BY Id DESC;`,
  },
  {
    metricId: 'smartBlock_count',
    featureId: 'smartBlock',
    title: 'لیست بلاک فعال',
    shouldUsePowerBI: false,
    source: 'SmartwifiCustomerClub.dbo.BlockedNumbers',
    note: 'لیست بلاک کلاب — منبع PowerBI نیست.',
    sql: `SELECT COUNT(*) AS cnt
FROM SmartwifiCustomerClub.dbo.BlockedNumbers WITH (NOLOCK)
WHERE BrandId = @brandId;`,
  },
]

export function metricQueryById(metricId: string): MetricQueryDoc | undefined {
  return METRIC_QUERY_DOCS.find((d) => d.metricId === metricId)
}
