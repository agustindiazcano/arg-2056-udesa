# Design base (v1 proposal)

Status: proposal. Open decisions are listed at the end; change them here first, then the tokens.
Scope: the visual language for charts and overlay UI. The 3D map art direction (Andes, terrain, particles) is separate and owned by the human.

## 1. Principles

- **Dark only in v1.** The app sits over a 3D map and is shown on a screen. Light mode is out of scope.
- **One idea per scene.** Large headline, one main chart, one supporting element. Presentation-first, not dashboard-first.
- **Every chart is auditable:** a visible source line (`Source: <source>, retrieved <date>`) and the MOCK badge when data is mock. Units on the axis title, always.
- **Color has one job per chart:** identity, magnitude, polarity or state. Never decoration.
- **Never color alone:** direct labels, a legend for 2 or more series, and a table view for every chart.
- **Nulls are not zeros.** Missing data renders as a gap or a "no data" tile, never as 0.

## 2. Tokens (dark)

| Token | Value | Use |
|---|---|---|
| `--page` | `#0d0d0d` | app background |
| `--surface` | `#1a1a19` | chart and panel surface |
| `--ink` | `#ffffff` | primary text, values |
| `--ink-2` | `#c3c2b7` | secondary text, legends |
| `--muted` | `#898781` | axes, labels, de-emphasis gray |
| `--grid` | `#2c2c2a` | gridlines (hairline) |
| `--baseline` | `#383835` | baseline, axis line, diverging midpoint |
| `--border` | `rgba(255,255,255,0.10)` | hairline rings |

Typeface: `system-ui, -apple-system, "Segoe UI", sans-serif` for everything in v1. Large standalone numbers use proportional figures; tables and axis ticks use `tabular-nums`. A distinctive display face is a polish-stage decision.

Spacing scale: 4, 8, 12, 16, 24, 32, 48 px. Radius: 4px on bar data-ends and chips.

## 3. Color jobs

**Scenarios (identity, 3 slots, fixed forever):**

| Scenario | Hex (dark) | Line |
|---|---|---|
| pessimistic | `#d95926` (orange) | 2px, label at line end |
| expected | `#3987e5` (blue) | 2px, label at line end |
| optimistic | `#199e70` (aqua) | 2px, label at line end |

Validated with the data-viz validator on the dark surface `#1a1a19`, all-pairs: lightness band PASS, chroma PASS, worst CVD pair ΔE 9.4 (target 8), worst normal-vision pair ΔE 20.9 (floor 15), contrast vs surface at least 3:1. The tritan-simulated distance is 4.0 and is not part of the gate, so scenario identity must also carry **direct labels and the legend**, never color alone. These three hues mean "scenario" everywhere; no other series in the same view may use them.

**Magnitude (sequential):** one hue, blue. In dark mode the near-zero end recedes toward the surface (darkest step) and larger values get lighter. Ramp from the reference palette: 700 `#0d366b`, 600 `#184f95`, 550 `#1c5cab`, 500 `#256abf`, 450 `#2a78d6`, 400 `#3987e5`, 350 `#5598e7`, 300 `#6da7ec`, 250 `#86b6ef`, 200 `#9ec5f4`, 150 `#b7d3f6`, 100 `#cde2fb`. Used for choropleths and heatmaps only. Check by eye on the real dark surface before shipping.

**Polarity (diverging):** blue to red, neutral midpoint `#383835`, equal steps per arm. Used for growth deltas and "above or below the LATAM average".

**Emphasis:** one accent (`#3987e5`) and everything else `--muted`. The honest default when one series is the point.

**Nominal categories** (products, provinces, resources) are one series: every mark takes the same blue (`#3987e5`). Never color them by value, because bar length or tile area already shows the value.

**State (reserved, always icon plus label):** good `#0ca30c`, warning `#fab219`, serious `#ec835a`, critical `#d03b3b`. The MOCK badge uses warning plus the text "MOCK DATA".

## 4. Chart conventions

- **Bars:** thin; 4px rounded data end anchored to the baseline; 2px gap in `--surface` between adjacent fills; hairline gridlines; labels only on the selected mark and the extremes.
- **Treemap:** area equals value; all tiles one hue; 2px surface gaps; direct label (name and share %) on tiles large enough, tooltip on all; when a group is highlighted, the other tiles go `--muted`.
- **Fan chart:** median line 2px in the scenario color; the p10 to p90 band is the same color at 18% opacity with no outline; history is a solid `--ink-2` line; a vertical divider at the last observed year labeled "History | Forecast". With the AI overlay on, the "without AI" median is drawn as a 1px dashed `--muted` line labeled "Without AI".
- **Choropleth:** sequential blue; provinces with no data use a hatched `--baseline` fill and appear in the legend as "No data".
- **Hover:** crosshair plus tooltip on lines and areas; per-mark tooltip on bars and tiles. Hit targets larger than the mark.
- **Numbers:** one formatter (`Intl.NumberFormat` with the app locale constant); compact notation above 10,000; always the unit.
- **Table view:** every chart has a toggle (`aria-pressed`) that swaps the chart for an HTML table of the same data. A `T` hotkey will be added later through a new `KeyAction`.

## 5. Motion

Scene change: 400ms fade plus 24px translate, ease-out cubic. Counters and series draw-in: 600ms. No bounce, no overshoot. All motion disabled under `prefers-reduced-motion: reduce`. GSAP arrives in the polish stage; until then CSS only.

## 6. Accessibility

Text contrast at least 4.5:1; marks at least 3:1 or backed by labels or the table view; full keyboard operation; visible focus ring (2px `#3987e5` with 2px offset); chart containers have `role="img"` and an `aria-label` that states the main takeaway.

## 7. Open decisions (for the human)

1. **UI language and number locale.** Placeholder: English labels, one `APP_LOCALE` constant. Spanish is the likely final choice.
2. **Typeface.** System sans for now; pick a display face at polish.
3. **Light mode.** Out of scope in v1; revisit only if the venue requires it.
4. **GDP currency basis.** Constant USD with a stated base year; which year must be chosen when real data arrives.
5. **Sub-step navigation inside a scene** (the storytelling beats, for example treemap then production then projects). The current key map only moves between scenes. This needs a design decision and a state extension before polish.
