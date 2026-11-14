# راه‌اندازی `@smartx/design-system` برای Monitoring

بدون این قدم، مهاجرت UI به دیزاین‌سیستم اسمارت ممکن نیست (پکیج روی npm نیست).

## یک‌بار روی لپ‌تاپ (با دسترسی به `git.smartx.ir`)

از ریشهٔ ریپوی Monitoring:

```powershell
cd "F:\Smart Drivers\Smart Problem\Small Projects\Monitoring"

# اگر هنوز لاگین GitLab نیستی:
# git credential یا Personal Access Token با scope read_repository

git submodule add https://git.smartx.ir:1000/front-end/smartx-web.git vendor/smartx-web
cd vendor/smartx-web
git checkout development   # یا یک commit ثابت
git sparse-checkout init --cone
git sparse-checkout set packages/design-system packages/configs
cd ../..

# فونت‌ها
New-Item -ItemType Directory -Force -Path public | Out-Null
Copy-Item -Recurse -Force "vendor\smartx-web\packages\design-system\public\fonts" "public\fonts"

# وابستگی‌ها (npm)
npm install @emotion/cache@^11.14.0 @emotion/react@^11.11.4 @emotion/styled@^11.11.5 `
  @mui/icons-material@^5.15.0 @mui/material@^5.15.0 @mui/stylis-plugin-rtl@^7.3.1 `
  @mui/x-date-pickers@^8.15.0 d3@^7.9.0 date-fns-jalali@4.1.0-0 stylis@^4.3.6

# لینک محلی (npm file:)
npm install "file:./vendor/smartx-web/packages/design-system"
npm install -D "file:./vendor/smartx-web/packages/configs"

git add .gitmodules vendor/smartx-web public/fonts package.json package-lock.json
git commit -m "chore: vendor smartx design system"
```

بعد در چت بگو: **«submodule آماده است»** تا مهاجرت کل پنل (ThemeProvider، شِل، صفحات) ادامه داده شود.

## جایگزین اگر submodule سخت است

فولدرهای زیر را کپی کن داخل Monitoring:

- `packages/design-system` → `vendor/smartx-web/packages/design-system`
- `packages/configs` → `vendor/smartx-web/packages/configs`
- `packages/design-system/public/fonts` → `public/fonts`

سپس همان `npm install file:...` بالا.
