# Where agentic AI goes wrong

Visual Displays assignment (Tufte chapter): an interactive heatmap + small multiples of 192 logged AI-agent incidents
(`src/data/incidents.csv`, Feb 2021 – May 2026).

React 19 · Vite · Tailwind 4 · shadcn/ui-style components on Radix primitives · Vaul drawer. The chart is hand-built (HTML grid + inline SVG);
D3 is not needed at runtime.

## Run
```bash
npm install
npm run dev        # http://localhost:5173/visualdisplays_tufte/
npm run build      # type-check + production build into dist/
```

## Deploy (GitHub Pages)
`.github/workflows/deploy.yml` builds and publishes on every push to `main` (or by hand from the Actions tab).
One-time setup: repo **Settings → Pages → Source: GitHub Actions**. Live URL: `https://tonylee314.github.io/visualdisplays_tufte/`.

## Tufte principles → where they show up
| Principle | Where |
|---|---|
| Macro / micro reading | Whole grid = overall pattern; margin totals; each cell = a count; click a cell / row / column for the individual incidents |
| Layering & separation | Classes are separated by whitespace and italic labels, not boxes or gridlines. In the time bars, gray is the whole row and a dark overlay is the part you point at; bars outside the chosen period fade but stay as context |
| Color and information | One sequential hue, used only for count, on a fixed scale (a shade means the same count under any filter). Zero cells are left blank |
| Heatmap | Category × vendor family; the "Dots" toggle turns each cell into one countable mark per incident |
| Small multiples | One bar strip per category: same x (half-years) and same y scale in every row, one shared time axis |
| Data-ink | No legend box, no borders around the chart, direct labels, no numbers printed inside cells (exact counts are in the tooltip, margin totals and screen-reader labels), annotation computed from the data |

## UI standards applied
- **shadcn/ui + Radix**: Button, Badge, ToggleGroup, Tooltip, DropdownMenu, Slider, Sheet in `src/components/ui/` (new-york style, neutral tokens, light theme only; chart ramp is Virginia Tech Chicago Maroon `#861F41`). Written by hand because the shadcn registry was unreachable when this was built; they follow the same structure, so `npx shadcn@latest add` can overwrite them.
- **Vaul**: incident list is a drag-to-dismiss drawer under 768px, a side Sheet above.
- **Motion (Emil Kowalski)**: only `transform`/`opacity` animate; strong ease-out curves; 125–180 ms for tooltips/menus, ≤ 300 ms for sheets; press feedback `scale(0.97)`; tooltips open instantly once one is open; no animation on filter changes or keyboard navigation; `prefers-reduced-motion` respected.
- **Human-centered design**: every control is visible and labelled (signifiers), every action gives immediate feedback (selection ring, dimmed rows, live period label), filters are reversible (Reset, Esc closes the panel), empty state explains itself, state is in the URL so a view can be shared.
- **Accessibility**: cells are buttons with full aria-labels; arrow keys move between cells (roving tabindex); visible focus rings; tooltip also opens on keyboard focus; 44px header tap targets.

## Header
The hero (title, summary line, per-class counts) is computed from the current filters, so it changes with the class toggles, vendor filter and period slider.

## Data notes
- The CSV starts with a BOM; it is stripped on load.
- "Affected agentic AI" mixes AI products with people/organisations harmed by AI output. `vendorOf()` in `src/lib/data.ts` groups them by regex; anything unmatched becomes "Other / non-vendor". Adjust the rules there.
- Vendor families are grouped by hand, and "Other / non-vendor" holds people and organisations harmed by AI output.
- Counts are logged incidents, not rates. A few source dates look out of order (e.g. some `Nov-23` rows sit among `Feb-23`); they are used as given.
