# Developer Handoff Spec: Claude FinOps Dashboard

**Product:** Enterprise AI Cost & Usage Analytics
**Version:** 1.0
**Date:** February 27, 2026
**Design System:** Custom — "Prism" (glassmorphism + dark mode)

---

## 1. Overview

An enterprise-grade cost and usage analytics dashboard for organizations deploying Claude plugins (Legal, Sales, Finance, HR) across teams. The product answers one critical question: **"What did all of that AI cost us, and was it worth it?"**

The current prototype (see screenshot) uses a flat dark theme with basic charts. The redesign introduces a premium glassmorphism aesthetic, animated data visualizations, real-time cost signals, and an ROI-first narrative that creates an immediate "ah moment" when enterprise buyers first log in.

### Design Philosophy
- **ROI-first, not data-first.** Lead with business impact, not raw numbers.
- **Glassmorphism layering.** Frosted-glass cards create depth hierarchy — primary metrics float above secondary context.
- **Motion as meaning.** Animated counters, smooth transitions, and micro-interactions convey real-time data flow.
- **Claude-native identity.** Warm amber/copper accent palette nods to Claude's brand without copying Anthropic's exact colors.

---

## 2. Design Tokens

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#0A0B0F` | Page background (near-black, NOT pure black) |
| `--bg-elevated` | `rgba(255, 255, 255, 0.03)` | Card backgrounds |
| `--bg-glass` | `rgba(255, 255, 255, 0.06)` | Glassmorphism panels |
| `--bg-glass-hover` | `rgba(255, 255, 255, 0.10)` | Card hover state |
| `--border-glass` | `rgba(255, 255, 255, 0.08)` | Card borders |
| `--border-glass-hover` | `rgba(255, 255, 255, 0.15)` | Card border hover |
| `--text-primary` | `#F5F5F7` | Headlines, primary numbers |
| `--text-secondary` | `rgba(255, 255, 255, 0.55)` | Labels, descriptions |
| `--text-tertiary` | `rgba(255, 255, 255, 0.35)` | Timestamps, metadata |
| `--accent-amber` | `#F59E0B` | Primary accent — savings, positive ROI |
| `--accent-amber-glow` | `rgba(245, 158, 11, 0.15)` | Glow behind accent elements |
| `--accent-violet` | `#8B5CF6` | Secondary accent — Claude brand nod |
| `--accent-emerald` | `#10B981` | Positive delta, cost savings |
| `--accent-rose` | `#F43F5E` | Negative delta, cost overruns |
| `--accent-sky` | `#38BDF8` | Info, links, tertiary accent |
| `--gradient-hero` | `linear-gradient(135deg, #F59E0B 0%, #8B5CF6 50%, #38BDF8 100%)` | Hero metric highlight border |
| `--gradient-mesh` | Radial mesh of amber/violet/sky at 5% opacity | Background ambient glow |

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-family` | `'Inter', -apple-system, sans-serif` | All text |
| `--font-mono` | `'JetBrains Mono', 'SF Mono', monospace` | Numbers, code, API keys |
| `--text-hero` | `48px / 700 / -0.02em` | Hero metric (Total Savings) |
| `--text-display` | `36px / 700 / -0.02em` | Section KPI numbers |
| `--text-heading-lg` | `20px / 600 / -0.01em` | Card titles |
| `--text-heading-sm` | `14px / 600 / 0` | Sub-section headings |
| `--text-body` | `14px / 400 / 0` | General body text |
| `--text-caption` | `12px / 500 / 0.02em` | Labels, badges |
| `--text-micro` | `11px / 500 / 0.04em` | Timestamps, footnotes |

### Spacing

| Token | Value |
|-------|-------|
| `--space-xs` | `4px` |
| `--space-sm` | `8px` |
| `--space-md` | `16px` |
| `--space-lg` | `24px` |
| `--space-xl` | `32px` |
| `--space-2xl` | `48px` |
| `--space-3xl` | `64px` |

### Effects

| Token | Value | Usage |
|-------|-------|-------|
| `--blur-glass` | `backdrop-filter: blur(24px)` | Glassmorphism cards |
| `--blur-heavy` | `backdrop-filter: blur(40px)` | Modal overlays |
| `--shadow-card` | `0 4px 24px rgba(0,0,0,0.3)` | Floating cards |
| `--shadow-glow-amber` | `0 0 40px rgba(245,158,11,0.12)` | Hero metric glow |
| `--shadow-glow-violet` | `0 0 30px rgba(139,92,246,0.10)` | Secondary accent glow |
| `--radius-sm` | `8px` | Buttons, badges |
| `--radius-md` | `12px` | Cards, inputs |
| `--radius-lg` | `16px` | Panels, modals |
| `--radius-xl` | `20px` | Hero cards |
| `--transition-fast` | `150ms cubic-bezier(0.4, 0, 0.2, 1)` | Hover states |
| `--transition-smooth` | `300ms cubic-bezier(0.4, 0, 0.2, 1)` | Panel transitions |
| `--transition-spring` | `500ms cubic-bezier(0.34, 1.56, 0.64, 1)` | Animated counters |

---

## 3. Page Layout

### Grid System
- **Max width:** `1440px`, centered
- **Padding:** `--space-xl` (32px) on sides
- **Main grid:** CSS Grid, `12 columns`, `--space-lg` (24px) gap
- **Card grid:** Auto-fill, `minmax(300px, 1fr)`

### Page Structure (Top to Bottom)

```
┌─────────────────────────────────────────────────────────┐
│  SIDEBAR (240px, collapsible)  │  MAIN CONTENT AREA     │
│                                │                         │
│  Logo                          │  ┌─ TOP BAR ──────────┐│
│  ─────────                     │  │ Org name / Search / ││
│  Dashboard  ●                  │  │ Date range / Avatar ││
│  Cost Explorer                 │  └─────────────────────┘│
│  Teams & Users                 │                         │
│  Plugins                       │  ┌─ HERO CARD ────────┐│
│  Alerts & Budgets              │  │ "You saved $42.8K   ││
│  API Keys                      │  │  this month"        ││
│  Settings                      │  │  vs. manual process ││
│  ─────────                     │  └─────────────────────┘│
│  Docs                          │                         │
│  Support                       │  ┌─ KPI ROW ──────────┐│
│                                │  │ Cost│Reqs│Tokens│ROI││
│                                │  └─────────────────────┘│
│                                │                         │
│                                │  ┌─ CHARTS ───────────┐│
│                                │  │ Spend Trend │ By    ││
│                                │  │  (area)     │ Team  ││
│                                │  └─────────────────────┘│
│                                │                         │
│                                │  ┌─ TABLE ────────────┐│
│                                │  │ Top Plugins by Cost ││
│                                │  │ w/ sparklines       ││
│                                │  └─────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

---

## 4. Components

### 4.1 Hero Savings Card (THE "AH MOMENT")

This is the single most important component. It answers the executive question immediately.

| Property | Value |
|----------|-------|
| Grid span | Full width (12 cols) |
| Height | `180px` |
| Background | `--bg-glass` + `--blur-glass` |
| Border | `1px solid` with animated `--gradient-hero` border |
| Border radius | `--radius-xl` |
| Inner glow | `--shadow-glow-amber` |

**Content layout:**
```
┌──────────────────────────────────────────────────────────┐
│                                                          │
│  ◉ ROI INSIGHT                          This month ▾    │
│                                                          │
│  Your teams saved                                        │
│  $42,847          ← animated counter, --text-hero        │
│  in estimated manual labor costs        ↑ 23% vs last   │
│                                                          │
│  ████████████████████░░░░░  78% of budget used           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Why this creates the "ah moment":** Instead of showing raw cost ($0.02), you frame it as *savings*. The executive sees "my legal team automated $42K of work this month using Claude plugins" — that's the pitch that sells the product.

**States:**
- **Loading:** Shimmer skeleton with gradient pulse
- **First visit (no data):** "Connect your first API key to see your ROI" + animated onboarding arrow
- **Negative ROI:** Card border shifts to `--accent-rose`, messaging changes to "Optimization opportunities found"

**Animation:**
| Element | Trigger | Animation | Duration | Easing |
|---------|---------|-----------|----------|--------|
| Dollar amount | On mount | Count up from $0 | 1200ms | `--transition-spring` |
| Percentage badge | After counter | Fade in + slide up 8px | 300ms | `--transition-smooth` |
| Budget bar | After badge | Width expansion left to right | 800ms | ease-out |
| Border gradient | Continuous | 360° rotation | 8000ms | linear |

### 4.2 KPI Metric Cards

| Property | Value |
|----------|-------|
| Grid | 4 columns, equal width |
| Height | `120px` |
| Background | `--bg-glass` |
| Border | `1px solid --border-glass` |
| Radius | `--radius-lg` |

**Card anatomy:**
```
┌───────────────────┐
│  Label       ⓘ   │  ← --text-caption, --text-tertiary
│  $12,847         │  ← --text-display, --font-mono
│  ↑ 12.3%  30d    │  ← delta badge + period
│  ▁▂▃▅▇█▆▄▃▂▁    │  ← inline sparkline (last 30 days)
└───────────────────┘
```

**Four cards:**
1. **Total Spend** — `--accent-amber` sparkline
2. **Total Requests** — `--accent-violet` sparkline
3. **Avg Cost/Request** — `--accent-sky` sparkline
4. **Est. Time Saved** — `--accent-emerald` sparkline (THIS is unique vs. Helicone)

**Delta badge variants:**

| Variant | Color | Icon |
|---------|-------|------|
| Positive (cost down) | `--accent-emerald` bg at 15% | `↓` |
| Positive (usage up) | `--accent-emerald` bg at 15% | `↑` |
| Negative (cost up) | `--accent-rose` bg at 15% | `↑` |
| Neutral | `--text-tertiary` bg at 10% | `→` |

**Hover state:** Card lifts (`translateY(-2px)`), border becomes `--border-glass-hover`, sparkline expands to show tooltip with exact value.

### 4.3 Spend Trend Chart (Area Chart)

| Property | Value |
|----------|-------|
| Grid span | 8 columns |
| Height | `360px` |
| Chart type | Stacked area with gradient fill |
| Library recommendation | `recharts` or `visx` |

**Visual treatment:**
- Area fills use team colors at 20% opacity with gradient to 0% at bottom
- Grid lines: `rgba(255,255,255,0.04)` — barely visible
- Axis labels: `--text-tertiary`, `--font-mono`, `--text-micro`
- Crosshair on hover: vertical line (`rgba(255,255,255,0.1)`) + tooltip card

**Tooltip card:**
```
┌─────────────────────┐
│  Feb 24, 2026       │
│  ─────────────────  │
│  ● Legal    $3,240  │
│  ● Sales    $2,180  │
│  ● Eng      $1,890  │
│  ● HR         $420  │
│  ─────────────────  │
│  Total      $7,730  │
└─────────────────────┘
```
Tooltip: `--bg-glass` + `--blur-heavy`, `--radius-md`, `--shadow-card`

### 4.4 Cost by Team / Plugin (Horizontal Bar + Donut)

| Property | Value |
|----------|-------|
| Grid span | 4 columns (right side) |
| Height | `360px` |

**Replaces the current "Cost by Model" and "Usage by API Key" with a more meaningful breakdown:**

```
┌─────────────────────────────┐
│  Cost by Team        See all│
│                             │
│     ◐  [Donut]              │
│    Total                    │
│   $12.8K                    │
│                             │
│  ● Legal      ████████ 41% │
│  ● Sales      ██████   29% │
│  ● Engineering████     19% │
│  ● HR         ██       11% │
│                             │
│  Toggle: [Team] [Plugin]    │
└─────────────────────────────┘
```

**Donut chart:**
- Inner radius: 65% of outer (thick ring, not thin)
- Center text: Total cost in `--text-heading-lg`
- Segment colors: Unique per team, pulled from a `teamColors` map
- Hover: Segment expands 4px outward, tooltip appears

**Toggle behavior:** Smooth crossfade (200ms) between "By Team" and "By Plugin" views. Same component, different data grouping.

### 4.5 Top Plugins Table

| Property | Value |
|----------|-------|
| Grid span | Full width (12 cols) |
| Rows | Default 5, expandable to 20 |

**Table anatomy:**
```
┌──────────────────────────────────────────────────────────────────┐
│  Plugin          Team       Requests  Cost     Trend     Status │
│  ────────────────────────────────────────────────────────────── │
│  ⚖ Contract      Legal      2,340    $3,240   ▁▃▅▇▆▄   ● Active│
│     Review                                                      │
│  💰 Pipeline     Sales      1,820    $2,180   ▂▄▆▇▅▃   ● Active│
│     Analyzer                                                    │
│  📋 Code Review  Eng        1,200    $1,890   ▃▅▇▅▃▂   ● Active│
│  ...                                                            │
│                                        [Show more ▾]            │
└──────────────────────────────────────────────────────────────────┘
```

**Row hover:** Entire row background shifts to `--bg-glass-hover`, cursor pointer. Click navigates to plugin detail view.

**Sparkline in table:** 30-day trend, 40px wide, 20px tall. Uses the row's accent color.

### 4.6 Sidebar Navigation

| Property | Value |
|----------|-------|
| Width | `240px` (expanded), `64px` (collapsed) |
| Background | `--bg-base` with subtle `--bg-elevated` tint |
| Border right | `1px solid --border-glass` |

**Nav items:**
```
┌──────────────────┐
│  ◆ Prism         │  ← Logo/product name
│                  │
│  Dashboard    ●  │  ← Active indicator: amber dot
│  Cost Explorer   │
│  Teams & Users   │
│  Plugins         │
│  Alerts          │
│  API Keys        │
│  ──────────────  │
│  Docs ↗          │
│  Support         │
│  ──────────────  │
│  ▾ Acme Corp     │  ← Org switcher
│    Free Trial    │
└──────────────────┘
```

**Active state:** Text becomes `--text-primary`, left border `2px solid --accent-amber`, background `--accent-amber-glow`.

**Collapse behavior:** Icons only at `64px`. Tooltip on hover shows label. Transition: `--transition-smooth`.

### 4.7 Date Range Selector

| Property | Value |
|----------|-------|
| Position | Top bar, right-aligned |
| Style | Segmented control |

**Options:** `7d` | `30d` | `90d` | `Custom`

**Active segment:** `--bg-glass-hover` background, `--text-primary` text.
**Custom:** Opens a date picker dropdown (glassmorphism styled).

### 4.8 Budget Progress Bar

Appears in the Hero Card and optionally on the Cost Explorer page.

| Property | Value |
|----------|-------|
| Height | `8px` |
| Background | `rgba(255,255,255,0.06)` |
| Fill | Gradient from `--accent-emerald` (0%) to `--accent-amber` (75%) to `--accent-rose` (100%) |
| Radius | `4px` |
| Transition | Width animates on data change, `--transition-smooth` |

**Threshold markers:** Vertical tick at 80% and 100% budget, `--text-tertiary` labels above.

---

## 5. User Flow: First-Time Setup → "Ah Moment"

```
Step 1: Sign Up
  └→ Email/SSO login
  └→ Create organization name

Step 2: Connect (30-second setup)
  └→ "Paste your Anthropic API key"
  └→ One-line proxy URL swap
  └→ Real-time connection test (green checkmark animation)

Step 3: Dashboard Loads (THE MOMENT)
  └→ 3-second loading animation: particles coalesce into the Hero Card
  └→ Hero card fades in with animated counter: "$0 → $X,XXX saved"
  └→ KPI cards cascade in (stagger: 100ms each)
  └→ Charts animate from left axis outward
  └→ User thinks: "I need to show this to my CFO"

Step 4: Explore
  └→ Click any KPI → drills into Cost Explorer
  └→ Click any team → filters all charts
  └→ Click any plugin → shows plugin detail
```

---

## 6. Responsive Behavior

| Breakpoint | Changes |
|------------|---------|
| Desktop XL (>1440px) | Max-width container, centered |
| Desktop (1024–1440px) | Default layout, all 4 KPI columns |
| Tablet (768–1024px) | Sidebar collapses to icons. KPI cards → 2x2 grid. Charts stack vertically. |
| Mobile (<768px) | Sidebar becomes bottom nav (5 icons). Hero card full-width, reduced height. KPI cards → vertical stack. Table becomes card list. |

---

## 7. Edge Cases

| Scenario | Behavior |
|----------|----------|
| **No data (new user)** | Empty state with animated onboarding illustration. "Connect your API key to see the magic." CTA button pulses gently. |
| **Single data point** | Charts show the one point + "More data coming soon" badge. No sparklines in KPIs. |
| **Very high cost** | Numbers abbreviate: $1,234,567 → $1.23M. Tooltip shows full number. |
| **Very low cost** | Show exact cents: $0.0023. Don't round to $0.00. |
| **Long team names** | Truncate with ellipsis at 18 chars. Full name in tooltip. |
| **100+ plugins** | Table paginates at 20 rows. "Show all" navigates to Plugins page. |
| **Budget exceeded** | Hero card border pulses `--accent-rose`. Alert badge appears on sidebar "Alerts" item. |
| **API key expired** | Yellow banner at top of dashboard: "API key expired. Reconnect →" |
| **Loading state** | All cards show shimmer skeleton (gradient pulse animation). No spinners. |
| **Error state** | Card shows: icon + "Unable to load" + "Retry" button. Muted `--text-tertiary` treatment. |
| **Offline/disconnected** | Gray overlay on cards with "Last updated 5m ago" badge. Auto-retry every 30s. |

---

## 8. Accessibility

### Focus Management
- Tab order: Sidebar nav → Top bar → Hero card → KPI cards (L→R) → Charts → Table
- Focus ring: `2px solid --accent-amber`, `2px offset`, visible on all interactive elements
- Skip link: "Skip to main content" as first focusable element

### ARIA Requirements
| Element | ARIA | Notes |
|---------|------|-------|
| Hero savings number | `role="status"`, `aria-live="polite"` | Announces updated savings value |
| KPI cards | `role="region"`, `aria-label="Total Spend: $12,847, up 12.3%"` | Full context in label |
| Charts | `role="img"`, `aria-label` with summary | "Spend trend showing costs rising from $8K to $12K over 30 days" |
| Delta badges | `aria-label="increased by 12.3 percent"` | Don't rely on color alone |
| Sparklines | `aria-hidden="true"` | Decorative; data is in the number |
| Sidebar nav | `role="navigation"`, `aria-label="Main"` | Standard nav landmark |
| Table | Standard `<table>` with `<th scope>` | Sortable columns announced |

### Color Contrast
- All text meets WCAG 2.1 AA (4.5:1 for body, 3:1 for large text)
- Delta badges use icon + color (never color alone)
- Chart segments have distinct patterns available for colorblind mode toggle

### Keyboard
- Arrow keys navigate table rows
- Enter/Space activates buttons and links
- Escape closes any overlay/dropdown
- Chart tooltip accessible via keyboard focus on data points

### Reduced Motion
- `prefers-reduced-motion: reduce` → disables all animations, counters show final value immediately, no gradient rotation on hero border

---

## 9. Animation & Motion Spec

| Element | Trigger | Animation | Duration | Easing |
|---------|---------|-----------|----------|--------|
| Page load | Mount | Stagger fade-in (opacity 0→1, translateY 12px→0) | 400ms per card, 100ms stagger | ease-out |
| Hero counter | Mount | Count up from 0 | 1200ms | spring(0.34, 1.56, 0.64, 1) |
| Hero border gradient | Continuous | 360° hue rotation | 8000ms | linear |
| KPI sparkline | Mount | Draw left to right (stroke-dashoffset) | 800ms | ease-out |
| Area chart | Mount | Clip-path reveal left to right | 1000ms | ease-out |
| Donut chart | Mount | Stroke-dashoffset per segment | 800ms | ease-out |
| Card hover | Hover | translateY(-2px), shadow increase | 150ms | ease |
| Sidebar collapse | Click | Width 240→64px, labels fade out | 300ms | ease-in-out |
| Tab switch (chart) | Click | Cross-fade (opacity swap) | 200ms | ease |
| Number change | Data update | Count from old → new value | 600ms | ease-out |
| Toast notification | Trigger | Slide in from right, auto-dismiss | Enter: 300ms, Exit: 200ms | ease |

---

## 10. Implementation Notes

### Recommended Stack
- **Framework:** Next.js 14+ (App Router) or Vite + React
- **Styling:** Tailwind CSS + CSS custom properties for tokens
- **Charts:** `recharts` (simpler) or `visx` (more control for glassmorphism overlays)
- **Animations:** `framer-motion` for mount animations + counter
- **Data fetching:** `@tanstack/react-query` with 30s polling
- **State:** Zustand for global filters (date range, team, plugin)

### Key Technical Decisions
1. **Glassmorphism performance:** Use `will-change: transform` on cards. Avoid blur on >6 overlapping elements. Test on integrated GPUs.
2. **Animated counters:** Use `framer-motion`'s `useSpring` + `useTransform`. Not CSS — need number formatting (commas, dollar signs).
3. **Chart responsiveness:** SVG-based charts with viewBox. Resize observer triggers re-render.
4. **Real-time updates:** WebSocket for live request stream. Debounce KPI recalculation to every 5 seconds.
5. **Dark mode only (v1):** Ship dark mode first. It's the premium look. Light mode is v2.

### Performance Targets
| Metric | Target |
|--------|--------|
| First Contentful Paint | <1.2s |
| Largest Contentful Paint | <2.5s |
| Time to Interactive | <3.0s |
| Dashboard data load | <800ms (after auth) |
| Chart render | <200ms |
| Bundle size (gzipped) | <180KB JS |

---

## 11. What Makes This Different from the Current Screenshot

| Current (v0) | Redesign (v1) |
|--------------|---------------|
| Flat dark cards, no depth | Glassmorphism layering with blur + borders |
| Raw cost number ($0.02) | ROI framing ("You saved $42,847") |
| Static bar charts | Animated area charts with gradient fills |
| "Usage by API Key" (technical) | "Cost by Team" (business language) |
| No sparklines | Inline sparklines in every KPI card |
| No budget tracking | Budget progress bar with threshold alerts |
| No motion | Choreographed mount animations + live counters |
| Basic color palette | Warm amber/violet gradient accents with glows |
| No empty states | Polished onboarding flow for new users |
| "Dashboard" (generic) | "Prism" (branded, memorable product name) |

---

*This spec is designed to be implemented incrementally: Hero Card → KPI Cards → Charts → Table → Sidebar polish.*
