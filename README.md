# Ignite UI for React Data Grid — built with Claude Code, Ignite UI CLI, and MCP

An enterprise-grade React Data Grid demo built with [Ignite UI for React](https://www.infragistics.com/products/ignite-ui-react), scaffolded by the [Ignite UI CLI](https://github.com/IgniteUI/igniteui-cli), and assembled with [Claude Code](https://www.anthropic.com/claude-code) using Ignite UI **Agent Skills** and **MCP servers** (CLI MCP and Theming MCP).

The grid is bound to a remote JSON endpoint and ships with grouping, filtering, sorting, pinning, paging, full-row selection, column moving, custom cell templates, eight built-in themes, a custom **Aurora Ops** theme, and a portal-rendered customer tooltip with a sparkline.

---

## 📺 Watch the walkthrough

[![Watch the video on YouTube](https://img.youtube.com/vi/yfMnSccmQqU/hqdefault.jpg)](https://youtu.be/yfMnSccmQqU)

**Build a React Data Grid from the Ignite UI CLI with Claude Code →** <https://youtu.be/yfMnSccmQqU>

## 📝 Read the blog post

**Build a React Data Grid with Claude Code, Ignite UI CLI, and MCP Servers →** <https://www.infragistics.com/blogs/react-data-grid-claude-code>

The post walks through two AI-assisted workflows for building this grid — adding Ignite UI to an existing React app, and starting from the Ignite UI CLI — and explains how Agent Skills and MCP servers feed real component context to the agent so it generates code that actually works.

---

## ✨ Features

- **Bound to a live JSON endpoint** with proper async loading, error, and abort handling
- **26 explicit columns** in a fixed order, with `currency` (UnitPrice / ExtendedPrice / Freight), `percent` (Discount), and plain numeric formatting via `IgrColumnPipeArgs`
- **Default group-by** on `ShipperName` with a visible group-by drop area
- **Pinning**: `OrderID` and `CustomerName` pinned left, `Salesperson` pinned right via per-column `pinningPosition`
- **Excel-style filtering**, **sorting**, **column moving**, **column resizing**, **full-row multi-select with row selectors**, **paginator**
- **Toolbar**: Column Pinning, Column Hiding, **Excel export**
- **Custom cell templates**
  - `Quantity` < 20 renders a red ▼ indicator alongside the value
  - `Salesperson` renders a circular avatar (Infragistics faces) plus name, with an initials-fallback for unknown names
- **Theme chooser** with 9 themes (8 built-in + Aurora Ops):
  - Material Dark / Light, Indigo Dark / Light, Bootstrap Dark / Light, Fluent Dark / Light, **Aurora Ops** (custom)
- **Aurora Ops** custom theme — dark navy surfaces, cyan/violet accents, 16 px rounded grid corners, uppercase 44 px headers, 72 px rows, cyan→violet hover accent bar, dark paginator
- **Customer tooltip** rendered through `ReactDOM.createPortal` into `document.body` (so it escapes the grid's virtualization `transform` containers) with:
  - Customer name + city / country
  - SVG sparkline with a red→yellow→green gradient and a dashed baseline
  - Total Shipments (▲ green when > 50, ▼ red otherwise), YTD Revenue, Revenue Target — all derived **deterministically** from row data so values are stable across renders
  - Auto-flip / clamp positioning, hidden on mouse leave, scroll, resize, and data change

---

## 🧱 Stack

| | |
|---|---|
| Framework | React 19.2 + TypeScript |
| UI components | `igniteui-react` ~19.6.2, `igniteui-react-grids` ~19.6.2 |
| Bundler | Vite 8 |
| Test runner | Vitest 4 + @testing-library/react |
| Lint | ESLint 9 (typescript-eslint, react-hooks) |
| Routing | react-router-dom 7 |
| Scaffolding | Ignite UI CLI 15 |

---

## 🚀 Quick start

```bash
npm install
npm start          # vite dev server (default http://localhost:3003 — falls back if busy)
npm run build      # tsc -b && vite build
npm run lint       # eslint . --max-warnings 0
npm test           # vitest
```

The grid loads its data from:

```
https://excel2json.io/api/share/0e3b829e-e63c-4eee-6c97-08da1411ad26
```

No API key is required.

---

## 🗂 Project layout

```
react-demo/
├── src/
│   ├── app/
│   │   ├── app.tsx                 # router outlet
│   │   ├── app-routes.tsx          # Grid1 mounted at "/"
│   │   ├── home/                   # secondary route
│   │   └── grid1/
│   │       ├── grid1.tsx           # the data grid page (columns, templates, tooltip, theme switch)
│   │       ├── style.module.css    # layout + Aurora Ops scoped overrides + tooltip styles
│   │       └── themes.ts           # 9 theme entries; CSS files imported via ?url
│   ├── igniteui-react-grids.d.ts   # type shim — see "Notes" below
│   └── main.tsx
├── public/
├── index.html
├── styles.css                      # global page background using --ig-surface-500
├── vite.config.ts                  # cssMinify disabled (see Notes)
└── ignite-ui-cli.json
```

---

## 🎨 Theming

The 8 built-in themes are loaded as separate CSS files via Vite's `?url` import and swapped at runtime by updating the `href` of a single `<link rel="stylesheet">` element managed in a `useEffect`. This keeps only one Ignite UI theme active at a time and avoids JS-injected CSS strings.

**Aurora Ops** rides on top of the dark Indigo prebuilt theme. When selected, the page wrapper gains an `auroraOps` CSS-module class which retargets a long list of documented Ignite UI grid CSS variables (`--ig-grid-header-background`, `--ig-grid-row-hover-background`, `--ig-grid-sorted-header-icon-color`, `--ig-grid-pinned-border-color`, `--ig-paginator-background`, …) plus page-level surface tokens (`--ig-surface-500`, `--ig-font-family`). Built-in themes are unaffected when Aurora Ops is not selected.

The Aurora Ops palette:

```
App background        #020617    Border         #1e293b
Surface               #0f172a    Border strong  #334155
Surface elevated      #162033    Primary cyan   #22d3ee
Primary text          #e2e8f0    Secondary      #8b5cf6
Secondary text        #cbd5e1    Success        #34d399
Muted text            #94a3b8    Warning        #fbbf24
                                 Danger         #f87171
Font: "Inter", "Titillium Web", "Roboto", "Segoe UI", sans-serif
```

---

## 💡 Tooltip implementation notes

- The tooltip renders with `ReactDOM.createPortal(..., document.body)`. **It must not render inside the grid DOM** — `IgrGrid` rows use `transform: translateY(...)` for virtualization, which traps `position: fixed` descendants and breaks them.
- Hover handlers capture `e.currentTarget` into a local variable **before** any `setState` call, so React can recycle the synthetic event safely.
- Mock metrics (`totalShipments`, `ytdRevenue`, `revenueTarget`, 12-point sparkline) are derived deterministically from `hashString("CustomerName|CustomerID")`, so the same row always yields the same numbers — no flicker between renders.
- The tooltip auto-hides on `mouseleave`, `window` `scroll` (capture phase, so internal scroll containers also fire), `resize`, and on grid data changes.
- The cell template and its handlers are referentially stable (`useCallback` + `useMemo`), so the grid does not re-render its columns on hover.

---

## 🛠 Notes on a few choices

- **`igniteui-react-grids` typings shim.** The published `igniteui-react-grids@19.6.2` `package.json` has `"typings": "grids.d.ts"` but ships that file under `src/grids.d.ts`. [`src/igniteui-react-grids.d.ts`](src/igniteui-react-grids.d.ts) re-exports from the real location so `tsc` resolves types.
- **`build.cssMinify: false`** in [`vite.config.ts`](vite.config.ts). rolldown-vite's default Lightning CSS minifier rejects modern CSS color syntax (`hsl(from … h s 50%)`) used in the prebuilt Indigo theme. Disabling minification keeps the published Ignite UI CSS intact rather than mutating it.

---

## 🤖 How this was built

This repo was generated and refined by **Claude Code** with help from:

- **Ignite UI CLI MCP** — for component discovery, API references, and React documentation lookup (grid toolbar, paging, selection, filtering, grouping, pinning, column resizing, cell templates).
- **Ignite UI Theming MCP** — for the React platform schema, palettes, typography, and elevation tokens.
- **Ignite UI Agent Skills**:
  - `igniteui-react-components` — picking the right `Igr*` component, JSX / event / ref patterns
  - `igniteui-react-customize-theme` — design tokens and theme overrides
  - `igniteui-react-optimize-bundle-size`
  - `igniteui-react-generate-from-image-design`

See the [blog post](https://www.infragistics.com/blogs/react-data-grid-claude-code) for the full workflow and the [video](https://youtu.be/yfMnSccmQqU) for a recorded walkthrough.

---

## 📚 Learn more

- [Ignite UI for React](https://www.infragistics.com/products/ignite-ui-react)
- [React Data Grid documentation](https://www.infragistics.com/products/ignite-ui-react/react/components/grids/data-grid.html)
- [Ignite UI CLI](https://github.com/IgniteUI/igniteui-cli)
- [Ignite UI on GitHub](https://github.com/IgniteUI/igniteui-react)
- [Claude Code](https://www.anthropic.com/claude-code)
- [Model Context Protocol](https://modelcontextprotocol.io/)

---

## License

Application code in this repo is provided for demonstration. **Ignite UI for React** components are licensed by Infragistics — see the [Ignite UI license](https://www.infragistics.com/legal/ultimate/license/).
