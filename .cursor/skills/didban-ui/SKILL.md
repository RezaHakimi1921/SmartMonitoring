---
name: didban-ui
description: >-
  Enforce Didban (SmartMonitoring) Figma Make UI: olive SmartX palette, CSS Modules,
  AppShell, wizard/report journey, DidbanToast, no SQL names in UI. Use when changing
  Monitoring pages, styles, toast, admin/users/report/wizard, or when user mentions
  دیدبان، Figma، بررسی جدید، تنظیمات، کاربران.
---

# Didban UI (الزامی)

قبل از هر پچ UI در `Small Projects/Monitoring` این سند را بخوان و رعایت کن:

**مرجع کامل:** [`docs/DIDBAN_UI.md`](../../../docs/DIDBAN_UI.md)

## قوانین سخت

1. پالت زیتونی SmartX (`#668100` / `#4e6300` / `#eff9d4`) — نه آبی قدیمی DESIGN.md و نه بنفش AI.
2. شِل فقط `AppShell` + CSS Module؛ صفحهٔ جدید = `eyebrow` + `h1` + توضیح داخل stage با padding کافی تا عنوان «بیرون نزند».
3. نوتیفیکیشن فقط `DidbanToast` — Snackbar تیره/قدیمی برای journey ممنوع.
4. در UI کاربر **هیچ** نام جدول/ستون SQL (`Fact_`, `BI_`, `dbo.`, …) نشان نده.
5. نکات پیگیری و کارت‌های مشابه: گرید کنار هم (۲ ستون دسکتاپ)، نه ردیف تمام‌عرض بلند.
6. گزارش: فلو ۴ استیج خلاصه → بخش‌ها → پیگیری → ارسال؛ ارسال با بلوک‌های بزرگ پیام مشتری و فرم دستیار.
7. استایل جدید را در CSS Module همان صفحه بنویس (`*.module.css`)؛ کلاس‌های سراسری legacy را گسترش نده مگر لازم.

## چک قبل از Done

- [ ] ظاهر با ویزارد/گزارش فعلی هم‌خانواده است
- [ ] عنوان صفحه در viewport بالا دیده می‌شود
- [ ] Toast در صورت ذخیره/ثبت از `DidbanToast` است
- [ ] `npx tsc --noEmit` سبز است
