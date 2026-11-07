import { getPool, sql } from './db'
import {
  dateKeyToDate,
  dateKeyToFa,
  faInt,
  faMoneyRial,
  faPercent,
  toDateKey,
} from './format'
import {
  getThresholds,
  toneByHigherBetter,
  toneByLowerBetterDays,
} from './thresholds'

export type FeatureId =
  | 'overall'
  | 'subscription'
  | 'survey'
  | 'groups'
  | 'brandSettings'
  | 'credit'
  | 'balance'
  | 'panelCharge'
  | 'connection'
  | 'complaints'
  | 'creditGeneration'
  | 'smartBlock'
  | 'event'

export type Tone = 'ok' | 'warn' | 'bad' | 'info'

export type ReportSection = {
  featureId: FeatureId
  title: string
  metrics: { label: string; value: string; note?: string; tone?: Tone }[]
  hints?: { text: string; tone?: 'ok' | 'warn' | 'bad' }[]
  rows?: { label: string; value: string }[]
}

export type BranchCtx = {
  branchId: number
  brandId: number
  smartwifiBranchId: number
  brandName: string
  branchName: string
}

type FactAgg = {
  FactureCount: number
  SubCount: number
  PriceSum: number
  SurveyCount: number
  SurveyEngaged: number
  SurveySatisfied: number
  SurveyTotalRated: number
  Customers: number
  CustomersStart: number
  CustomersYear: number
  ActiveMonth: number
  LostCustomers: number
  LostThisMonth: number
  CreatedAct: number
  UsedAct: number
  CreatedPrice: number
  UsedPrice: number
  NegChargeDays: number
  DisconnectDays: number
  DayCount: number
  NewCustomers: number
  SubRows: { label: string; value: string }[]
  /** منبع متریک‌های عملکرد: SmartBi */
  source: 'smartbi' | 'fallback'
}

const TITLES: Record<FeatureId, string> = {
  overall: 'عملکرد کلی',
  subscription: 'گزارش اشتراک‌گیری',
  survey: 'نظرسنجی',
  groups: 'گروه‌بندی و چیدمان',
  brandSettings: 'تنظیمات برند و ارزیابی',
  credit: 'اعتبار مشتریان',
  creditGeneration: 'تولید اعتبار',
  event: 'ایونت',
  smartBlock: 'لیست بلاک مشتریان',
  balance: 'تراز مشتریان',
  panelCharge: 'شارژ پنل',
  connection: 'وضعیت اتصال',
  complaints: 'شکایات مشتریان',
}

async function query<T extends Record<string, unknown>>(
  text: string,
  params: Record<string, unknown> = {},
): Promise<T[]> {
  const pool = await getPool()
  const req = pool.request()
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === 'number' && Number.isInteger(v)) req.input(k, sql.Int, v)
    else if (typeof v === 'number') req.input(k, sql.Float, v)
    else if (typeof v === 'string') req.input(k, sql.NVarChar, v)
    else if (v instanceof Date) req.input(k, sql.DateTime, v)
    else req.input(k, v as never)
  }
  const res = await req.query(text)
  return (res.recordset ?? []) as T[]
}

export async function resolveBranch(branchId: number): Promise<BranchCtx> {
  const rows = await query<{
    brandId: number
    branchId: number
    smartwifiBranchId: number
    brandName: string
    branchName: string
  }>(
    `SELECT TOP 1
      b.Id AS brandId,
      br.Id AS branchId,
      CAST(ISNULL(br.SmartwifiBranchId, br.Id) AS int) AS smartwifiBranchId,
      LTRIM(RTRIM(b.Name)) AS brandName,
      LTRIM(RTRIM(br.Name)) AS branchName
    FROM SmartwifiCustomerClub.dbo.Branches br
    INNER JOIN SmartwifiCustomerClub.dbo.Brands b ON b.Id = br.BrandId
    WHERE br.Id = @branchId
       OR CAST(ISNULL(br.SmartwifiBranchId, 0) AS int) = @branchId
       OR TRY_CAST(br.SepandBranchCloudConsumerId AS bigint) = @branchId
    ORDER BY CASE WHEN br.Id = @branchId THEN 0 ELSE 1 END`,
    { branchId },
  )
  if (!rows[0]) {
    throw new Error('مجموعه پیدا نشد')
  }
  return rows[0]
}

const num = (v: unknown) => Number(v ?? 0) || 0

/**
 * مبنای گزارش‌های عملکردی = SmartPowerBI (همان منبع Insight):
 * Fact_Subscription / Fact_SalesSummary / Fact_SatisfactionSummary /
 * BI_BranchLostCustomers / BI_BranchCredit
 * شارژ و قطع همچنان از Fact_Branch (DW).
 */
async function loadLiveMetrics(
  ctx: BranchCtx,
  fromKey: number,
  toKey: number,
): Promise<FactAgg> {
  const sw = ctx.smartwifiBranchId || ctx.branchId
  const branchId = ctx.branchId
  const fromYm = Math.floor(fromKey / 100)
  const toYm = Math.floor(toKey / 100)

  const empty: FactAgg = {
    FactureCount: 0,
    SubCount: 0,
    PriceSum: 0,
    SurveyCount: 0,
    SurveyEngaged: 0,
    SurveySatisfied: 0,
    SurveyTotalRated: 0,
    Customers: 0,
    CustomersStart: 0,
    CustomersYear: 0,
    ActiveMonth: 0,
    LostCustomers: 0,
    LostThisMonth: 0,
    CreatedAct: 0,
    UsedAct: 0,
    CreatedPrice: 0,
    UsedPrice: 0,
    NegChargeDays: 0,
    DisconnectDays: 0,
    DayCount: 0,
    NewCustomers: 0,
    SubRows: [],
    source: 'smartbi',
  }

  const [subBi, salesBi, satBi, lostBi, creditBi, opsDw, subBreakdown] =
    await Promise.all([
      // Insight: memberCount / MinFactureCount
      query<{
        memberCount: number | null
        MinFactureCount: number | null
      }>(
        `SELECT
          SUM(CAST(ISNULL(memberCount,0) AS float)) AS memberCount,
          SUM(CAST(ISNULL(MinFactureCount,0) AS float)) AS MinFactureCount
         FROM SmartPowerBI.dbo.Fact_Subscription WITH (NOLOCK)
         WHERE BranchID = @sw
           AND DateKey BETWEEN @fromKey AND @toKey`,
        { sw, fromKey, toKey },
      ),
      query<{
        TotalOrders: number | null
        Sales: number | string | null
      }>(
        `SELECT
          SUM(CAST(ISNULL(TotalOrders,0) AS float)) AS TotalOrders,
          SUM(CAST(ISNULL(InvoiceSubTotal,0) AS float)) AS Sales
         FROM SmartPowerBI.dbo.Fact_SalesSummary WITH (NOLOCK)
         WHERE BranchID = @sw
           AND DateKey BETWEEN @fromKey AND @toKey`,
        { sw, fromKey, toKey },
      ),
      query<{
        TotalReviews: number | null
        Satisfied: number | null
        SmsCount: number | null
      }>(
        `SELECT
          SUM(CAST(ISNULL(TotalReviews,0) AS float)) AS TotalReviews,
          SUM(CAST(ISNULL(satisfiedReviews,0) AS float)) AS Satisfied,
          SUM(CAST(ISNULL(SmsCount,0) AS float)) AS SmsCount
         FROM SmartPowerBI.dbo.Fact_SatisfactionSummary WITH (NOLOCK)
         WHERE BranchId = @sw
           AND DateKey BETWEEN @fromKey AND @toKey`,
        { sw, fromKey, toKey },
      ),
      query<{
        CustomerInLastYear: number | null
        CustomerLost: number | null
        LostThisMonth: number | null
        newCustomers: number | null
        CustomerThinMonth: number | null
        SalesCustomer: number | null
        YearMonth: string | null
      }>(
        `SELECT TOP 1
          CustomerInLastYear, CustomerLost, LostThisMonth, newCustomers,
          CustomerThinMonth, SalesCustomer, YearMonth
         FROM SmartPowerBI.dbo.BI_BranchLostCustomers WITH (NOLOCK)
         WHERE Branchid = @sw
           AND TRY_CAST(YearMonth AS int) BETWEEN @fromYm AND @toYm
         ORDER BY YearMonth DESC`,
        { sw, fromYm, toYm },
      ),
      query<{
        CreatedAct: number | null
        UsedAct: number | null
        CreatedPrice: number | string | null
        UsedPrice: number | string | null
      }>(
        `SELECT
          SUM(ISNULL(GeneratedCreditCount,0)) AS CreatedAct,
          SUM(ISNULL(UsedCreditCount,0)) AS UsedAct,
          SUM(CAST(ISNULL(GeneratedCreditSum,0) AS bigint)) AS CreatedPrice,
          SUM(CAST(ISNULL(SumUsedCredit,0) AS bigint)) AS UsedPrice
         FROM SmartPowerBI.dbo.BI_BranchCredit WITH (NOLOCK)
         WHERE BranchID = @sw
           AND TRY_CAST(YearMonth AS int) BETWEEN @fromYm AND @toYm`,
        { sw, fromYm, toYm },
      ),
      query<{
        Customers: number | null
        CustomersStart: number | null
        NegChargeDays: number | null
        DisconnectDays: number | null
        DayCount: number | null
        NewCustomers: number | null
      }>(
        `SELECT
          MAX(TotalCustomerCount) AS Customers,
          MIN(TotalCustomerCount) AS CustomersStart,
          SUM(CASE WHEN ISNULL(HowManydayschargeisNegetive,0) > 0 THEN 1 ELSE 0 END) AS NegChargeDays,
          SUM(CASE WHEN ISNULL(HowManydaysDisconnected,0) > 0 THEN 1 ELSE 0 END) AS DisconnectDays,
          COUNT(*) AS DayCount,
          SUM(NewCustomerCount) AS NewCustomers
         FROM SmartProjectDW.dbo.Fact_Branch WITH (NOLOCK)
         WHERE BranchKey IN (@sw, @branchId)
           AND DateKey BETWEEN @fromKey AND @toKey`,
        { sw, branchId, fromKey, toKey },
      ),
      query<{
        PersianName: string
        SubFactureCount: number
        AllFactureCount: number
        SubRate: number
      }>(
        `SELECT TOP 12 PersianName, SubFactureCount, AllFactureCount, SubRate
         FROM SmartProjectDW.dbo.BranchSubscriptionResults WITH (NOLOCK)
         WHERE SmartBranchId = @sw
           AND CreatedAt = (
             SELECT MAX(CreatedAt)
             FROM SmartProjectDW.dbo.BranchSubscriptionResults WITH (NOLOCK)
             WHERE SmartBranchId = @sw
           )
         ORDER BY CASE WHEN PersianName = N'کل' THEN 0 ELSE 1 END, AllFactureCount DESC`,
        { sw },
      ),
    ])

  // جمع ازدست‌رفته در کل ماه‌های بازه (جدا از TOP 1 آخرین ماه)
  const lostRange = await query<{
    LostSum: number | null
    NewSum: number | null
    ThinSum: number | null
  }>(
    `SELECT
      SUM(ISNULL(CustomerLost,0)) AS LostSum,
      SUM(ISNULL(newCustomers,0)) AS NewSum,
      SUM(ISNULL(CustomerThinMonth,0)) AS ThinSum
     FROM SmartPowerBI.dbo.BI_BranchLostCustomers WITH (NOLOCK)
     WHERE Branchid = @sw
       AND TRY_CAST(YearMonth AS int) BETWEEN @fromYm AND @toYm`,
    { sw, fromYm, toYm },
  )

  const memberCount = num(subBi[0]?.memberCount)
  const minFacture = num(subBi[0]?.MinFactureCount)
  const salesOrders = num(salesBi[0]?.TotalOrders)
  const priceSum = num(salesBi[0]?.Sales)

  // سفارش برای درصد اشتراک = MinFactureCount (تعریف Insight)
  let factureCount = minFacture > 0 ? minFacture : salesOrders
  let subCount = memberCount

  const reviews = num(satBi[0]?.TotalReviews)
  const satisfied = num(satBi[0]?.Satisfied)
  const smsSurvey = num(satBi[0]?.SmsCount)

  const lostLatest = lostBi[0]
  const customersYear = num(lostLatest?.CustomerInLastYear)
  const lostCustomers = num(lostRange[0]?.LostSum) || num(lostLatest?.CustomerLost)
  const lostThisMonth = num(lostLatest?.LostThisMonth)
  const activeMonth =
    num(lostLatest?.CustomerThinMonth) || num(lostRange[0]?.ThinSum)
  const newFromLost =
    num(lostRange[0]?.NewSum) || num(lostLatest?.newCustomers)

  const ops = opsDw[0]
  const credit = creditBi[0]

  return {
    ...empty,
    FactureCount: factureCount,
    SubCount: subCount,
    PriceSum: priceSum,
    SurveyCount: smsSurvey > 0 ? smsSurvey : reviews,
    SurveyEngaged: reviews,
    SurveySatisfied: satisfied,
    SurveyTotalRated: reviews,
    Customers: customersYear || num(ops?.Customers),
    CustomersStart: num(ops?.CustomersStart),
    CustomersYear: customersYear,
    ActiveMonth: activeMonth,
    LostCustomers: lostCustomers,
    LostThisMonth: lostThisMonth,
    CreatedAct: num(credit?.CreatedAct),
    UsedAct: num(credit?.UsedAct),
    CreatedPrice: num(credit?.CreatedPrice),
    UsedPrice: num(credit?.UsedPrice),
    NegChargeDays: num(ops?.NegChargeDays),
    DisconnectDays: num(ops?.DisconnectDays),
    DayCount: num(ops?.DayCount),
    NewCustomers: newFromLost || num(ops?.NewCustomers),
    source: minFacture > 0 || salesOrders > 0 || reviews > 0 ? 'smartbi' : 'fallback',
    SubRows: subBreakdown
      .filter((r) => (r.PersianName || '').trim() !== 'کل')
      .slice(0, 8)
      .map((r) => ({
        label: (r.PersianName || '').trim(),
        value: `${faPercent(num(r.SubRate), 1)} (${faInt(r.SubFactureCount)} از ${faInt(r.AllFactureCount)})`,
      })),
  }
}

function emptySection(featureId: FeatureId, note?: string): ReportSection {
  return {
    featureId,
    title: TITLES[featureId],
    metrics: [
      {
        label: 'وضعیت',
        value: 'داده‌ای در این بازه نیست',
        tone: 'warn',
        note,
      },
    ],
  }
}

function overall(f: FactAgg): ReportSection {
  const avg = f.FactureCount > 0 ? f.PriceSum / f.FactureCount : 0
  const sat =
    f.SurveyTotalRated > 0
      ? (f.SurveySatisfied / f.SurveyTotalRated) * 100
      : 0
  const engage =
    f.FactureCount > 0 ? (f.SurveyEngaged / f.FactureCount) * 100 : 0
  const hints: ReportSection['hints'] = []
  if (f.FactureCount === 0 && f.DayCount === 0 && f.Customers === 0) {
    return emptySection('overall', 'برای این شعبه در بازه انتخابی ردیفی نیست')
  }
  const satTone = toneByHigherBetter(sat, getThresholds().satisfaction)
  if (satTone === 'bad' || satTone === 'warn') {
    hints.push({
      text: `رضایتمندی ${faPercent(sat)} است (آستانه خوب ≥ ${getThresholds().satisfaction.ok}٪)`,
      tone: satTone,
    })
  }
  const engTone = toneByHigherBetter(engage, getThresholds().surveyEngageVsOrders)
  if (engTone === 'bad' || engTone === 'warn') {
    hints.push({
      text: 'نرخ مشارکت نظرسنجی نسبت به سفارش‌ها پایین است',
      tone: engTone,
    })
  }
  return {
    featureId: 'overall',
    title: TITLES.overall,
    metrics: [
      {
        label: 'تعداد سفارش',
        value: faInt(f.FactureCount),
        tone: f.FactureCount > 0 ? 'ok' : 'info',
        note: 'SmartBi · Fact_Subscription/Sales',
      },
      {
        label: 'میانگین سفارش',
        value: faMoneyRial(avg),
        tone: 'info',
      },
      {
        label: 'رضایت مشتریان',
        value: sat > 0 ? faPercent(sat) : '—',
        tone: sat > 0 ? satTone : 'nodata',
      },
      {
        label: 'نرخ مشارکت نظرسنجی',
        value: engage > 0 ? faPercent(engage) : '—',
        tone: engage > 0 ? engTone : 'info',
      },
    ],
    hints,
  }
}

function subscription(f: FactAgg): ReportSection {
  const pct =
    f.FactureCount > 0 ? (f.SubCount / f.FactureCount) * 100 : 0
  const tone = toneByHigherBetter(pct, getThresholds().subscription)
  const hints: ReportSection['hints'] = []
  if (tone === 'bad' || tone === 'warn') {
    hints.push({
      text: `اشتراک‌گیری ${faPercent(pct)} است — فرصت ایونت جذب شماره / آموزش صندوق`,
      tone,
    })
  } else if (pct > 0) {
    hints.push({
      text: 'اشتراک‌گیری در محدوده قابل قبول نسبت به آستانه Insight است',
      tone: 'ok',
    })
  }
  return {
    featureId: 'subscription',
    title: TITLES.subscription,
    metrics: [
      {
        label: 'درصد اشتراک‌گیری',
        value: faPercent(pct),
        tone: pct > 0 ? tone : 'nodata',
        note: `آستانه خوب ≥ ${getThresholds().subscription.ok}٪ · SmartBi Fact_Subscription`,
      },
      {
        label: 'سفارش با اشتراک',
        value: faInt(f.SubCount),
        tone: 'info',
      },
      {
        label: 'کل سفارش (مبنای Insight)',
        value: faInt(f.FactureCount),
        tone: 'info',
      },
    ],
    rows: f.SubRows.length > 0 ? f.SubRows : undefined,
    hints,
  }
}

function survey(f: FactAgg): ReportSection {
  const sat =
    f.SurveyTotalRated > 0
      ? (f.SurveySatisfied / f.SurveyTotalRated) * 100
      : 0
  const responses = f.SurveyEngaged
  const canEngageRate =
    f.SurveyCount > 0 &&
    responses > 0 &&
    responses <= f.SurveyCount * 1.2
  const engage = canEngageRate ? (responses / f.SurveyCount) * 100 : 0
  const satTone = toneByHigherBetter(sat, getThresholds().satisfaction)
  const engTone = toneByHigherBetter(engage, getThresholds().surveyResponse)
  return {
    featureId: 'survey',
    title: TITLES.survey,
    metrics: [
      {
        label: 'پیامک نظرسنجی',
        value: faInt(f.SurveyCount),
        tone: f.SurveyCount > 0 ? 'ok' : 'info',
        note: 'SmartBi · Fact_SatisfactionSummary',
      },
      {
        label: 'پاسخ ثبت‌شده',
        value: faInt(responses),
        tone: 'info',
      },
      {
        label: 'رضایت',
        value: sat > 0 ? faPercent(sat) : '—',
        tone: sat > 0 ? satTone : 'nodata',
      },
      {
        label: 'نرخ پاسخ',
        value: engage > 0 ? faPercent(engage) : '—',
        tone: engage > 0 ? engTone : 'info',
      },
    ],
  }
}

function credit(f: FactAgg): ReportSection {
  const useRate =
    f.CreatedPrice > 0 ? (f.UsedPrice / f.CreatedPrice) * 100 : 0
  const noCreditData = f.CreatedAct === 0 && f.UsedAct === 0
  const useTone = toneByHigherBetter(useRate, getThresholds().creditUse)
  return {
    featureId: 'credit',
    title: TITLES.credit,
    metrics: [
      {
        label: 'تعداد اعتبار تولیدشده',
        value: faInt(f.CreatedAct),
        tone: f.CreatedAct > 0 ? 'ok' : f.FactureCount > 0 ? 'warn' : 'info',
        note: 'SmartBi · BI_BranchCredit',
      },
      {
        label: 'تعداد اعتبار مصرف‌شده',
        value: faInt(f.UsedAct),
        tone: 'info',
      },
      {
        label: 'مشارکت در استفاده (مبلغ)',
        value: noCreditData ? '—' : faPercent(useRate),
        tone: noCreditData ? 'info' : useTone,
      },
      {
        label: 'مبلغ تولید / مصرف',
        value: `${faMoneyRial(f.CreatedPrice)} / ${faMoneyRial(f.UsedPrice)}`,
        tone: 'info',
      },
    ],
  }
}

function creditGeneration(f: FactAgg): ReportSection {
  const useRate =
    f.CreatedPrice > 0 ? (f.UsedPrice / f.CreatedPrice) * 100 : 0
  const noCreditData = f.CreatedAct === 0 && f.CreatedPrice === 0
  const suggestPct = noCreditData ? 5 : useRate < 20 ? 7 : useRate < 35 ? 5 : 3
  const suggestDays = noCreditData ? 30 : useRate < 20 ? 45 : 30
  const useTone = toneByHigherBetter(useRate, getThresholds().creditUse)
  return {
    featureId: 'creditGeneration',
    title: TITLES.creditGeneration,
    metrics: [
      {
        label: 'پیشنهاد درصد',
        value: faPercent(suggestPct, 0),
        tone: noCreditData ? 'info' : 'ok',
      },
      {
        label: 'پیشنهاد مدت',
        value: `${faInt(suggestDays)} روز`,
        tone: noCreditData ? 'info' : 'ok',
      },
      {
        label: 'مصرف فعلی',
        value: noCreditData ? '—' : faPercent(useRate),
        tone: noCreditData ? 'info' : useTone,
      },
    ],
    hints: noCreditData
      ? undefined
      : [
          {
            text:
              useTone === 'bad' || useTone === 'warn'
                ? 'بر اساس رفتار خرید، افزایش درصد یا مدت می‌تواند مشارکت را بالا ببرد'
                : 'مصرف اعتبار قابل قبول است؛ تغییر شدید لازم نیست',
            tone: useTone === 'ok' ? ('ok' as const) : ('warn' as const),
          },
        ],
  }
}

function balance(f: FactAgg): ReportSection {
  const yearBase = f.CustomersYear || f.Customers
  const lostRate =
    yearBase > 0 ? (f.LostCustomers / yearBase) * 100 : 0
  const lostTone =
    lostRate <= 0
      ? ('ok' as const)
      : lostRate >= getThresholds().lostRate.bad
        ? ('bad' as const)
        : lostRate >= getThresholds().lostRate.warn
          ? ('warn' as const)
          : ('ok' as const)
  const hints: ReportSection['hints'] = []
  if (f.LostCustomers > 0) {
    hints.push({
      text: `${faInt(f.LostCustomers)} مشتری از دست‌رفته در بازه — برای بازگردانی ایونت/پیامک هدفمند پیشنهاد شود`,
      tone: lostTone === 'ok' ? 'warn' : lostTone,
    })
  }
  if (f.LostThisMonth > 0) {
    hints.push({
      text: `${faInt(f.LostThisMonth)} نفر فقط در آخرین ماه از دست رفته‌اند؛ نقطه ضعف وفاداری را با مشتری مطرح کنید`,
      tone: 'bad',
    })
  }
  return {
    featureId: 'balance',
    title: TITLES.balance,
    metrics: [
      {
        label: 'مشتریان یک سال اخیر',
        value: faInt(yearBase),
        tone: 'info',
        note: 'SmartBi · BI_BranchLostCustomers',
      },
      {
        label: 'فعال ماه اخیر',
        value: faInt(f.ActiveMonth),
        tone: f.ActiveMonth > 0 ? 'ok' : 'info',
      },
      {
        label: 'از دست‌رفته در بازه',
        value: faInt(f.LostCustomers),
        tone: f.LostCustomers > 0 ? lostTone : 'ok',
      },
      {
        label: 'از دست‌رفته ماه آخر',
        value: faInt(f.LostThisMonth),
        tone: f.LostThisMonth > 0 ? 'bad' : 'ok',
      },
      {
        label: 'مشتری جدید در بازه',
        value: faInt(f.NewCustomers),
        tone: f.NewCustomers > 0 ? 'ok' : 'info',
      },
      {
        label: 'نرخ ازدست‌رفته',
        value: yearBase > 0 ? faPercent(lostRate) : '—',
        tone: yearBase > 0 ? lostTone : 'info',
        note: `آستانه هشدار ≥ ${getThresholds().lostRate.warn}٪`,
      },
    ],
    hints,
  }
}

function panelCharge(f: FactAgg): ReportSection {
  const tone = toneByLowerBetterDays(f.NegChargeDays, getThresholds().negChargeDays)
  return {
    featureId: 'panelCharge',
    title: TITLES.panelCharge,
    metrics: [
      {
        label: 'روزهای شارژ منفی / کم',
        value: `${faInt(f.NegChargeDays)} روز`,
        tone,
      },
      {
        label: 'از کل روزهای بازه',
        value: faInt(f.DayCount),
        tone: 'info',
      },
    ],
    hints:
      f.NegChargeDays > 0
        ? [
            {
              text: 'در بخشی از بازه شارژ پیامک کافی نبوده؛ برای ارسال پایدار شارژ را بررسی کنید',
              tone: tone === 'ok' ? 'warn' : tone,
            },
          ]
        : undefined,
  }
}

function connection(f: FactAgg): ReportSection {
  const tone = toneByLowerBetterDays(
    f.DisconnectDays,
    getThresholds().disconnectDays,
  )
  return {
    featureId: 'connection',
    title: TITLES.connection,
    metrics: [
      {
        label: 'روزهای قطع ارتباط',
        value: `${faInt(f.DisconnectDays)} روز`,
        tone,
      },
    ],
    hints:
      f.DisconnectDays > 0
        ? [
            {
              text: 'قطع ارتباط باعث ناقص شدن فاکتور و گزارش می‌شود',
              tone: tone === 'ok' ? 'warn' : tone,
            },
          ]
        : undefined,
  }
}

async function groups(ctx: BranchCtx): Promise<ReportSection> {
  const rows = await query<{
    Id: number
    Name: string
    Active: boolean
    MinTotalShopping: number
    MaxTotalShopping: number
    CustomerCount: number
  }>(
    `SELECT Id, Name, Active, MinTotalShopping, MaxTotalShopping, CustomerCount
     FROM SmartwifiCustomerClub.dbo.ClubGroups WITH (NOLOCK)
     WHERE BranchId = @branchId AND ISNULL(Deleted,0)=0
     ORDER BY [Order]`,
    { branchId: ctx.branchId },
  )
  const active = rows.filter((r) => r.Active)
  const amountGroups = active
    .filter((r) => (r.MaxTotalShopping || 0) > 0 || (r.MinTotalShopping || 0) > 0)
    .sort((a, b) => a.MinTotalShopping - b.MinTotalShopping)
  let overlap = false
  for (let i = 1; i < amountGroups.length; i += 1) {
    if (amountGroups[i].MinTotalShopping < amountGroups[i - 1].MaxTotalShopping) {
      overlap = true
      break
    }
  }
  return {
    featureId: 'groups',
    title: TITLES.groups,
    metrics: [
      {
        label: 'تعداد گروه فعال',
        value: faInt(active.length),
        tone: active.length > 0 ? 'ok' : 'bad',
      },
      {
        label: 'وضعیت هم‌پوشانی مبلغی',
        value: overlap ? 'تداخل دارد' : 'بدون تداخل مبلغی',
        tone: overlap ? 'bad' : 'ok',
      },
    ],
    rows: active.slice(0, 8).map((g) => ({
      label: g.Name,
      value:
        (g.MaxTotalShopping || 0) > 0
          ? `${faMoneyRial(g.MinTotalShopping)} تا ${faMoneyRial(g.MaxTotalShopping)}`
          : 'بدون بازه مبلغی',
    })),
    hints: [
      {
        text: overlap
          ? 'بازه گروه‌ها با هم تداخل دارد و باید اصلاح شود'
          : 'گروه‌های مبلغی با هم هم‌پوشانی ندارند',
        tone: overlap ? 'bad' : 'ok',
      },
    ],
  }
}

async function smartBlock(ctx: BranchCtx): Promise<ReportSection> {
  const rows = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt
     FROM SmartwifiCustomerClub.dbo.BlockedNumbers WITH (NOLOCK)
     WHERE BrandId = @brandId`,
    { brandId: ctx.brandId },
  )
  const cnt = Number(rows[0]?.cnt ?? 0)
  return {
    featureId: 'smartBlock',
    title: TITLES.smartBlock,
    metrics: [
      {
        label: 'تعداد افراد بلاک',
        value: `${faInt(cnt)} نفر`,
        tone: cnt > 500 ? 'warn' : 'info',
      },
    ],
  }
}

async function event(ctx: BranchCtx): Promise<ReportSection> {
  const rows = await query<{
    Id: number
    Name: string
    FireDate: Date | string | null
    Fired: boolean
    CreationTime: Date | string
  }>(
    `SELECT TOP 5 Id, Name, FireDate, Fired, CreationTime
     FROM SmartwifiCustomerClub.dbo.BrandEvents WITH (NOLOCK)
     WHERE BrandId = @brandId AND ISNULL(Deleted,0)=0
     ORDER BY Id DESC`,
    { brandId: ctx.brandId },
  )
  const last = rows[0]
  if (!last) {
    return {
      featureId: 'event',
      title: TITLES.event,
      metrics: [
        { label: 'آخرین ایونت', value: 'ثبت نشده', tone: 'warn' },
      ],
      hints: [
        {
          text: 'برای این مجموعه ایونت فعالی پیدا نشد',
          tone: 'warn',
        },
      ],
    }
  }
  const when = last.FireDate || last.CreationTime
  const label =
    when instanceof Date
      ? when.toLocaleDateString('fa-IR')
      : String(when).slice(0, 10)
  return {
    featureId: 'event',
    title: TITLES.event,
    metrics: [
      {
        label: 'آخرین ایونت',
        value: last.Name || 'بدون عنوان',
        tone: 'info',
      },
      {
        label: 'تاریخ',
        value: label,
        tone: 'info',
      },
      {
        label: 'وضعیت ارسال',
        value: last.Fired ? 'اجرا شده' : 'در صف / آماده',
        tone: last.Fired ? 'ok' : 'warn',
      },
    ],
    rows: rows.slice(1).map((e) => ({
      label: e.Name || `ایونت ${e.Id}`,
      value: e.Fired ? 'اجرا شده' : 'آماده‌سازی',
    })),
  }
}

async function brandSettings(ctx: BranchCtx): Promise<ReportSection> {
  // DiagReports.Smartwifibranchid در عمل شناسه شعبه کلاب (Branches.Id) را نگه می‌دارد.
  const diags = await query<{ DiagType: number; Value: string; title: string }>(
    `SELECT TOP 20 d.DiagType, d.Value, RTRIM(t.Fa_TypeName) AS title
     FROM SmartProjectDW.dbo.DiagReports d WITH (NOLOCK)
     LEFT JOIN SmartProjectDW.dbo.DiagType t ON t.TypeID = d.DiagType
     WHERE d.Smartwifibranchid IN (@branchId, @sw)
       AND ISNULL(d.IsDeleted,0)=0
       AND d.IsDiage = 1
       AND d.DiagType IN (10,11,13,16,18,19,33)
     ORDER BY d.DateTime DESC`,
    { branchId: ctx.branchId, sw: ctx.smartwifiBranchId },
  )
  const byType = new Map(diags.map((d) => [d.DiagType, d]))
  const logo = byType.get(16)
  const surveyOff = byType.get(10)
  const clubOff = byType.get(33)
  return {
    featureId: 'brandSettings',
    title: TITLES.brandSettings,
    metrics: [
      {
        label: 'لوگو',
        value: logo ? 'نیاز به بررسی' : 'مشکلی گزارش نشده',
        tone: logo ? 'bad' : 'ok',
      },
      {
        label: 'نظرسنجی',
        value: surveyOff ? 'هشدار فعال' : 'بدون هشدار',
        tone: surveyOff ? 'bad' : 'ok',
      },
      {
        label: 'وضعیت باشگاه',
        value: clubOff ? 'هشدار فعال' : 'بدون هشدار',
        tone: clubOff ? 'bad' : 'ok',
      },
    ],
    rows: diags.slice(0, 6).map((d) => ({
      label: d.title?.trim() || `مورد ${d.DiagType}`,
      value: d.Value,
    })),
    hints: diags.slice(0, 2).map((d) => ({
      text: d.Value,
      tone: 'warn' as const,
    })),
  }
}

async function complaints(
  ctx: BranchCtx,
  fromKey: number,
  toKey: number,
): Promise<ReportSection> {
  const diags = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt
     FROM SmartProjectDW.dbo.DiagReports d WITH (NOLOCK)
     WHERE d.Smartwifibranchid IN (@branchId, @sw)
       AND ISNULL(d.IsDeleted,0)=0
       AND d.IsDiage = 1
       AND d.DiagType IN (4,15,17,35,36)
       AND d.DateTime >= DATEADD(day, -120, GETDATE())`,
    { branchId: ctx.branchId, sw: ctx.smartwifiBranchId },
  )
  const flows = await query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt
     FROM SmartProjectDW.dbo.PBI_SurveyFlows f WITH (NOLOCK)
     INNER JOIN SmartProjectDW.dbo.PBI_SurveyForms sf WITH (NOLOCK)
       ON sf.SurveyFormId = f.SurveyFormId
     WHERE sf.BranchID IN (@branchId, @sw)
       AND f.SurveyFlowStatusId IN (1,2,3)
       AND f.StartDate >= DATEADD(day, -90, GETDATE())`,
    { branchId: ctx.branchId, sw: ctx.smartwifiBranchId },
  ).catch(() => [{ cnt: 0 }])

  const openFlows = Number(flows[0]?.cnt ?? 0)
  const diagCnt = Number(diags[0]?.cnt ?? 0)
  return {
    featureId: 'complaints',
    title: TITLES.complaints,
    metrics: [
      {
        label: 'جریان‌های باز / در حال پیگیری',
        value: faInt(openFlows),
        tone: openFlows > 0 ? 'bad' : 'ok',
      },
      {
        label: 'هشدارهای مرتبط نظرسنجی',
        value: faInt(diagCnt),
        tone: diagCnt > 0 ? 'warn' : 'ok',
      },
      {
        label: 'بازه بررسی',
        value: `${dateKeyToFa(fromKey)} تا ${dateKeyToFa(toKey)}`,
        tone: 'info',
      },
    ],
    hints:
      openFlows > 0
        ? [
            {
              text: `${faInt(openFlows)} جریان باز پیگیری‌نشده وجود دارد`,
              tone: 'bad',
            },
          ]
        : [{ text: 'جریان باز ثبت‌شده‌ای پیدا نشد', tone: 'ok' }],
  }
}

export async function loadSection(
  featureId: FeatureId,
  ctx: BranchCtx,
  fromKey: number,
  toKey: number,
): Promise<ReportSection> {
  const factHeavy = new Set<FeatureId>([
    'overall',
    'subscription',
    'survey',
    'credit',
    'creditGeneration',
    'balance',
    'panelCharge',
    'connection',
  ])
  if (factHeavy.has(featureId)) {
    const fact = await loadLiveMetrics(ctx, fromKey, toKey)
    switch (featureId) {
      case 'overall':
        return overall(fact)
      case 'subscription':
        return subscription(fact)
      case 'survey':
        return survey(fact)
      case 'credit':
        return credit(fact)
      case 'creditGeneration':
        return creditGeneration(fact)
      case 'balance':
        return balance(fact)
      case 'panelCharge':
        return panelCharge(fact)
      case 'connection':
        return connection(fact)
    }
  }
  switch (featureId) {
    case 'groups':
      return groups(ctx)
    case 'smartBlock':
      return smartBlock(ctx)
    case 'event':
      return event(ctx)
    case 'brandSettings':
      return brandSettings(ctx)
    case 'complaints':
      return complaints(ctx, fromKey, toKey)
    default:
      return emptySection(featureId)
  }
}

export async function loadDiag(
  ctx: BranchCtx,
  types: number[],
): Promise<{ id: number; title: string; value: string; active: boolean }[]> {
  const typeFilter =
    types.length > 0
      ? `AND d.DiagType IN (${types.map((_, i) => `@t${i}`).join(',')})`
      : ''
  const params: Record<string, unknown> = {
    branchId: ctx.branchId,
    sw: ctx.smartwifiBranchId,
  }
  types.forEach((t, i) => {
    params[`t${i}`] = t
  })
  const rows = await query<{
    DiagType: number
    title: string
    Value: string
    IsDiage: boolean
  }>(
    `SELECT d.DiagType, RTRIM(t.Fa_TypeName) AS title, d.Value, d.IsDiage
     FROM SmartProjectDW.dbo.DiagReports d WITH (NOLOCK)
     LEFT JOIN SmartProjectDW.dbo.DiagType t ON t.TypeID = d.DiagType
     WHERE d.Smartwifibranchid IN (@branchId, @sw)
       AND ISNULL(d.IsDeleted,0)=0
       AND d.IsDiage = 1
       ${typeFilter}
     ORDER BY d.DateTime DESC`,
    params,
  )
  const seen = new Set<number>()
  const out: { id: number; title: string; value: string; active: boolean }[] =
    []
  for (const r of rows) {
    if (seen.has(r.DiagType)) continue
    seen.add(r.DiagType)
    out.push({
      id: r.DiagType,
      title: (r.title || '').trim() || `مورد ${r.DiagType}`,
      value: r.Value,
      active: !!r.IsDiage,
    })
  }
  return out
}

export function parseDateKeyFromJalali(text: string): number | null {
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(text)
  if (!m) return null
  return toDateKey(Number(m[1]), Number(m[2]), Number(m[3]))
}
