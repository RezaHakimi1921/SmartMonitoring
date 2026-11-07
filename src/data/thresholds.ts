/** نمایش راهنما — مقادیر زنده از config سرور در Admin قابل ویرایش‌اند. */
export const THRESHOLDS = {
  subscription: { ok: 70, warn: 50, unit: '%', label: 'اشتراک‌گیری' },
  satisfaction: { ok: 60, warn: 45, unit: '%', label: 'رضایت' },
  surveyEngageVsOrders: {
    ok: 8,
    warn: 3,
    unit: '%',
    label: 'مشارکت نظرسنجی نسبت به سفارش',
  },
  surveyResponse: { ok: 20, warn: 8, unit: '%', label: 'پاسخ به نظرسنجی' },
  creditUse: { ok: 15, warn: 5, unit: '%', label: 'مصرف اعتبار' },
  lostRate: {
    ok: 0,
    warn: 3,
    unit: '%',
    label: 'ازدست‌رفته (هشدار از / بحرانی از)',
  },
} as const
