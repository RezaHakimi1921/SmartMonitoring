# Override: SmartX Monitoring App Shell (Light + FA)

Overrides `MASTER.md` for the shipped React app (not a marketing landing).

## Mode
- **Light glass** dashboard (not full dark MASTER). Dark MASTER remains reference for future dark theme.
- Typography: **Estedad / Vazirmatn** (Persian). Do not switch to Fira Sans/Code for UI copy.

## Color palette (Analytics Dashboard — light, UUPM colors.csv)
| Role | Hex | Token |
|------|-----|-------|
| Primary | `#1E40AF` | `--primary` |
| Secondary | `#3B82F6` | `--secondary` |
| Accent | `#D97706` | `--warning` / CTA highlight |
| Background | `#F8FAFC` | `--surface` |
| Foreground | `#1E3A8A` | `--on-surface` |
| Card | glass white | `--surface-glass` |
| Muted | `#E9EEF6` / `#475569` | `--surface-dim` / `--on-surface-variant` |
| Border | `#DBEAFE` | `--outline-variant` |
| Success | `#16A34A` | `--success` |
| Destructive | `#DC2626` | `--error` |
| Brand teal accent | `#147d74` | `--iso-accent` (legacy SmartX cue) |

## Glass card
- `backdrop-filter: blur(15px)` (`--blur-amount`)
- `background: rgba(255,255,255,0.72–0.88)`
- `border: 1px solid rgba(30, 64, 175, 0.12)`
- Text contrast ≥ 4.5:1 on glass

## Loading skeleton
- Stable KPI grid placeholders, `aria-busy="true"`
- Shimmer; disable under `prefers-reduced-motion`
- No full-page spinner for per-section loads
