# Where agentic AI goes wrong

Visual Displays assignment (Tufte chapter): an interactive heatmap + small multiples of 192 logged AI-agent incidents
(`data/incidents.csv`, Feb 2021 – May 2026). Plain HTML/CSS/JS with D3 v7 vendored in `vendor/` (no build step, works offline).

## Run
```bash
python3 -m http.server 8000   # then open http://localhost:8000
```
(or VS Code "Live Server"; `d3.text` needs http, not `file://`)

## Design choices mapped to Tufte
| Principle | Where it shows up |
|---|---|
| Macro / micro reading | Whole grid = overall pattern; margins = totals; each cell = a count; click a cell / row / column to list the individual incidents |
| Layering & separation | The three classes are separated by whitespace and italic labels, not boxes or gridlines. In the time bars, gray is the whole row and a dark overlay is the selected subset |
| Color and information | One sequential hue, used only for count. Class is never encoded in hue. Zero cells are left blank (no ink for no data) |
| Heatmap | Category × vendor family; "one dot per incident" toggle turns each cell into countable marks |
| Small multiples | One bar strip per category, same x (half-years 2021–2026) and same y scale in every row, one shared time axis |
| Data-ink | No legend box, no borders, direct labels, count printed only where ≥ 3, annotation computed from the data |

## Data notes
- The CSV starts with a BOM; it is stripped on load.
- "Affected agentic AI" mixes AI products with people/organisations harmed by AI output. `vendorOf()` in `main.js` groups them by regex; anything unmatched becomes "Other / non-vendor". Adjust the rules there.
- Counts are logged incidents, not rates. A few dates in the source look out of order (e.g. some `Nov-23` rows sit among `Feb-23`); they are used as given.
