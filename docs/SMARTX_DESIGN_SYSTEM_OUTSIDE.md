# Using the SmartX design system outside `smartx-web`

Use this when your app lives in **its own repository** (not as `apps/<name>` inside
`smartx-web`) but must look like the SmartX apps: same theme, fonts, components and
icons. Hand this file, together with `docs/NEW_APP_FRONTEND_GUIDE.md` (in smartx-web), to your
developer or AI assistant.

> If you *can* put the app inside `smartx-web`, do that instead
> (`docs/NEW_APP_FRONTEND_GUIDE.md`). You get auth, API client, Redux store, CI
> and Docker for free. Outside the monorepo you get **only the design system**.

---

## 1. What you get, and what you don't

| Package | Outside smartx-web? | Notes |
|---|---|---|
| `@smartx/design-system` (theme, tokens, components, icons) | ✅ yes | Self-contained: depends only on React, MUI, Emotion, date pickers, d3 and date-fns-jalali. |
| `@smartx/configs` | ✅ needed (build-time only) | The design system's `tsconfig.json` extends it. |
| `@smartx/api-client`, `@smartx/state-management`, `@smartx/shared-hooks` | ❌ not supported | Written for the monorepo apps. Copy the ideas (Desk SSO + `refresh_token` handoff, tenant in URL; see guide §4 and §8), not the packages. |

**Important facts:**
- The design system is **not published** to any npm registry. Our Nexus
  (`192.168.210.235:8081`) only has `npm-proxy` and `npm-group`; there is no hosted
  npm repo to publish to.
- The package ships **TypeScript source** (`"main": "./src/index.ts"`), not compiled JS. Your bundler compiles it. **Vite** does this out of the box; other bundlers need TS/TSX transpilation enabled for that folder.
- Your stack must be **React 19 + MUI 5 + Emotion**. A different UI stack (Vue, Angular, plain CSS) can reuse only the **tokens** (§7).

---

## 2. Recommended setup: git submodule + local link (works today)

This was tested end to end on 2026-10-21: an empty Vite + React 19 app outside the monorepo, consuming the design system this way, passed `tsc --noEmit` and `vite build`. In the browser it rendered `ThemeProvider`, `Navigation`, `TextField`, `PersianDatePicker`, `Select`, `PaginatedTable` and `Dialog` with RTL and the IRANYekan font, with no console errors.

### 2.1 Add smartx-web as a submodule

```bash
git submodule add https://git.smartx.ir:1000/front-end/smartx-web.git vendor/smartx-web
cd vendor/smartx-web
git checkout <commit-or-tag-on-development>    # pin a version; don't track a moving branch
cd ../..
git add .gitmodules vendor/smartx-web
git commit -m "chore: add smartx design system"
```

You need read access to `front-end/smartx-web` on `git.smartx.ir`.

To keep the checkout small, make it sparse (optional):
```bash
cd vendor/smartx-web
git sparse-checkout set packages/design-system packages/configs
```

### 2.2 Dependencies (`package.json`)

The design system's own dependencies must be installed in **your** app, because a linked package's dependencies are not installed for you:

```json
{
  "dependencies": {
    "@smartx/design-system": "link:./vendor/smartx-web/packages/design-system",
    "@emotion/cache": "^11.14.0",
    "@emotion/react": "^11.11.4",
    "@emotion/styled": "^11.11.5",
    "@mui/icons-material": "^5.15.0",
    "@mui/material": "^5.15.0",
    "@mui/stylis-plugin-rtl": "^7.3.1",
    "@mui/x-date-pickers": "^8.15.0",
    "d3": "^7.9.0",
    "date-fns-jalali": "4.1.0-0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "stylis": "^4.3.6"
  },
  "devDependencies": {
    "@smartx/configs": "link:./vendor/smartx-web/packages/configs",
    "@types/d3": "^7.4.3",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@types/stylis": "^4.2.5",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.5.0",
    "vite": "^5.3.4"
  }
}
```

- **pnpm:** use `link:` as above.
- **npm or yarn:** use `file:./vendor/smartx-web/packages/design-system` (and the same for configs).
- Keep these versions in step with `vendor/smartx-web/packages/design-system/package.json` whenever you update the submodule.
- **`@smartx/configs` is required:** without it, `vite build` fails with `failed to resolve "extends":"@smartx/configs/tsconfig.base.json"`.
- In the office network, point npm at Nexus with an `.npmrc` containing `registry=http://192.168.210.235:8081/repository/npm-group/`.

### 2.3 `vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // one copy of React / Emotion / MUI, or the theme silently stops applying
    dedupe: ['react', 'react-dom', '@emotion/react', '@emotion/styled', '@mui/material'],
  },
});
```

### 2.4 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

- `"types": ["vite/client"]` lets TypeScript accept the design system's `.svg` imports.
- Your `tsc` also type-checks the design-system source, because it is source. Keep `strict` on: the design system is written for it.

### 2.5 Fonts (required)

The theme's `@font-face` rules use absolute URLs (`/fonts/IRANYekanX(Pro)/…`), so your app must serve the files at that path:

```bash
mkdir -p public
cp -R vendor/smartx-web/packages/design-system/public/fonts public/
```

Commit `public/fonts`, or copy it in your build script. If the app is served under a sub-path (e.g. `/myapp/` or `/monitoring/`), the fonts must still be reachable at `/fonts/...` on that host, or you need your own `@font-face` CSS pointing at the right path.

Optional assets in the same `public/` folder: `images/` (illustrations, avatars) and `icon-fonts/`.

### 2.6 `index.html` and the root component

```html
<html lang="fa" dir="rtl">
```

```tsx
// src/main.tsx
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { ThemeProvider, CssBaseline } from '@smartx/design-system';
import App from './App';

function Root() {
  // CssBaseline + the RTL stylis plugin flip body { direction }; force RTL like the SmartX apps do.
  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.body.dir = 'rtl';
    document.documentElement.style.direction = 'rtl';
    document.body.style.direction = 'rtl';
  }, []);
  return (
    <ThemeProvider defaultMode="light" defaultDirection="rtl">
      <CssBaseline />
      <App />
    </ThemeProvider>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><Root /></StrictMode>);
```

From here, **everything in `docs/NEW_APP_FRONTEND_GUIDE.md` §5–§7 and §9 applies unchanged**: tokens, typography, components, icons, UI patterns, Persian digits and dates, RTL rules. Section §0 rules 3–12 and 16–20 apply too. Ignore the parts about `@api-client`, `@state-management`, the monorepo scaffolding and the monorepo CI.

### 2.7 Updating the design system

```bash
cd vendor/smartx-web
git fetch origin
git checkout <new-commit-or-tag>
cd ../..
pnpm install                     # pick up any new design-system dependency versions
pnpm typecheck && pnpm build
git add vendor/smartx-web
git commit -m "chore: bump smartx design system"
```

Read the design-system changes between the two commits first (`git log <old>..<new> -- packages/design-system`). Component props and token names can change.

### 2.8 CI and Docker

- **GitLab CI:** set `GIT_SUBMODULE_STRATEGY: recursive`. The job token of your project must be allowed to read `front-end/smartx-web`: in smartx-web, Settings → CI/CD → Job token permissions → add your project. The alternative is a deploy token.
- **Docker:** run the build *after* the submodule is checked out, and `COPY vendor/ vendor/` before `pnpm install`, so the `link:` targets exist inside the image.

---

## 3. Alternatives (and why they're second choice)

| Option | How | Pros | Cons |
|---|---|---|---|
| **Copy the folder** | Copy `packages/design-system` (+ `packages/configs`) into your repo, then `link:` it as in §2.2. | No submodule or CI access needed. | You drift from the real design system immediately. Every fix has to be copied by hand. Only for a throwaway prototype. |
| **Publish to a registry** | smartx-web CI publishes `@smartx/design-system` to the GitLab package registry (npm) or to a new Nexus hosted npm repo. Consumers run `npm install @smartx/design-system@x.y.z`. | Normal versioned dependency, clean upgrades. | **Not set up today.** It needs a publish job, a version scheme, `@smartx/configs` published too (or the tsconfig `extends` removed), and the package only works with bundlers that transpile TS from `node_modules`. Ask the front-end team if you need this; it is the right long-term fix. |

---

## 4. Non-React stacks: tokens only

If your app isn't React + MUI, you can still match colors, typography, spacing and radius by consuming the token file:

- `packages/design-system/src/theme/designTokens.ts`:
  - `designTokens.color.{light,dark}.schemes` (Material 3 roles: primary, surface, onSurface, outline, …)
  - `designTokens.typography.{mobile,tablet,desktop}` (size, line height and weight per variant)
  - `designTokens.scale.*` (spacing, radius, border widths)
  - `designTokens.fonts` (font family, weights)
- A working example is the Astro + Tailwind help center: `apps/help-center/src/config/tailwind-theme.ts` maps the tokens into a Tailwind theme, and `tailwind-typography-plugin.mjs` maps the typography variants.
- Copy the fonts (§2.5) and set `font-family: IRANYekanXFaNum` with `direction: rtl`.

**Note:** the React theme takes its palette from the brand tonal scales, so a few runtime colors differ slightly from the `schemes` values (e.g. React `primary` is `#668100`, schemes say `#759400`). For pixel-perfect parity, take the colors from the running theme (Storybook) rather than from `schemes`.

---

## 5. Checklist

- [ ] `vendor/smartx-web` submodule pinned to a known commit
- [ ] design-system dependencies installed in the app (§2.2), plus `@smartx/configs`
- [ ] `resolve.dedupe` in Vite (§2.3)
- [ ] `"types": ["vite/client"]` in tsconfig (§2.4)
- [ ] `public/fonts/IRANYekanX(Pro)/…` served at `/fonts/…` (§2.5)
- [ ] `<html lang="fa" dir="rtl">`, `ThemeProvider` (light, rtl), `CssBaseline`, and the RTL `useEffect` (§2.6)
- [ ] UI rules from `docs/NEW_APP_FRONTEND_GUIDE.md` §0 followed (tokens only, typography variants, design-system components, logical CSS)
- [ ] CI checks out submodules and can read `front-end/smartx-web` (§2.8)
- [ ] Storybook used as the component reference: in a smartx-web checkout run `pnpm --filter @smartx/design-system storybook` (port 6006)
