# Solar Dusk Theme

The product UI follows the Solar Dusk palette: a charcoal canvas, ember cards, and neon accents. Dark mode is the canonical look and remains active by default; light mode reuses the same token values for consistency.

## Core Colors

| Token | Hex | HSL | Notes |
| --- | --- | --- | --- |
| `--background` | `#1C1917` | `24 10% 10%` | Application background, navigation chrome |
| `--card` | `#292524` | `12 6% 15%` | Cards, panels, glass surfaces |
| `--primary` | `#FF7D1A` | `26 100% 55%` | Solar highlight for CTAs, active states |
| `--accent` | `#0498D7` | `198 96% 43%` | Secondary highlight / interactive accent |
| `--border` | `#3B342F` | `24 12% 23%` | Panel outlines, input borders |
| `--muted` | `#221F1C` | `22 10% 18%` | Subtle fills, table stripes |
| `--positive` | `#21C06C` | `152 71% 45%` | Gains / success badges |
| `--negative` | `#EF4444` | `0 84% 55%` | Losses / destructive actions |
| `--warning` | `#FFB020` | `35 96% 52%` | Risk or pending states |
| `--info` | `#32A7FF` | `200 90% 52%` | Informational alerts |

### Sidebar
- `--sidebar`: mirrors the card tone `#292524`
- `--sidebar-primary`: `#FF7D1A` for the active item
- `--sidebar-accent`: `#0498D7` on hover states
- `--sidebar-border`: `#3B342F` for separators

### Shadows & Glass
- Shadow stack derives from `--shadow-color` (`24 18% 8%`) for progressive depth (`shadow`, `shadow-md`, `shadow-card`).
- `.glass` combines the card fill with transparency (92%) and the same border tone for a subtle frosted finish.

## Typography
- **Sans-serif:** `'Oxanium', sans-serif` (default, ~90% of the content)
- **Serif:** `'Merriweather', serif` for occasional emphasis/long-form copy
- **Monospace:** `'Fira Code', monospace` for numeric values and code-esque readouts (`font-mono`)

These assignments feed Tailwind via `--font-sans`, `--font-serif`, and `--font-mono`.

## Usage Notes
1. **Mode:** `<ThemeProvider defaultTheme="dark">` ensures Solar Dusk loads immediately; toggling to light currently keeps the same palette to preserve brand consistency.
2. **Surface hierarchy:** Combine `.glass` or `bg-card` with the `shadow-*` utilities for elevated panels; `.metric-card` adds hover lift.
3. **Charts:** `--chart-1..5` supply orange, cyan, magenta, jade, and amber for multi-series visuals.
4. **Feedback & status:** map wins/losses to `positive`/`negative`; use `warning` for pending, `info` for neutral alerts, and `destructive` for irreversible actions.

Implementation lives in `src/index.css` (tokens + utilities) and `tailwind.config.js` (color extensions). Continuous alignment with the screenshot reference keeps the product and admin apps visually coherent.
