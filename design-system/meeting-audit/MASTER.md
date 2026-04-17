# Meeting Audit Design System

> First check `pages/[page-name].md`. If a page override exists, it wins. Otherwise this file is the source of truth.

## Product Position

Meeting Audit is an operational planning surface, not a marketing site. The UI should feel like an executive working session: calm, data-rich, and immediately useful for decisions about cost, time, staffing, client impact, and schedule change.

## Core Direction

- **Visual theme:** Editorial operations room.
- **Mood:** Warm, deliberate, credible, high-signal.
- **Differentiator:** Pair analytical dashboard density with a more human, narrative heading style.
- **Implementation source of truth:** [theme.css](/c:/projects/meetingaudit/web/src/styles/theme.css)

## Design Principles

1. Business signal first.
   Metrics, cost deltas, time load, and client impact should be visible before explanatory prose.
2. Warmth over sterile enterprise UI.
   Keep the warm neutral canvas and amber highlights. Do not flatten the product into generic blue-gray admin chrome.
3. Density without clutter.
   Prefer compact groupings, consistent spacing, and strong labels over oversized cards and empty whitespace.
4. Decision states must be obvious.
   Baseline, proposed, changed, and at-risk states need consistent visual treatment across dashboard and schedule views.
5. Explain only where it helps action.
   Tooltips, metric definitions, and note chips are good. Meta cards that narrate the interface are not.

## Typography

- **Display / metric voice:** `Fraunces`
  Use for hero titles, high-value metrics, and moments that need emphasis or gravity.
- **System / interface voice:** `Geist Variable`
  Use for navigation, controls, tables, helper text, and dense analytical content.
- **Hierarchy**
  Use a restrained scale. Current anchors are `11`, `12`, `14`, `16`, `20`, `24`, `32`, `48+`.
- **Usage rules**
  Keep body copy in sans.
  Keep long paragraphs out of serif.
  Use uppercase tracked labels for metadata, not full sentences.

## Color System

The palette already works. Keep the current semantic structure and treat these roles as product vocabulary:

| Role | Intent | Notes |
|------|--------|-------|
| `background` / `surface-canvas` | App canvas | Warm neutral, slightly editorial |
| `card` / `surface-panel` | Elevated panels | Frosted, luminous, never harsh white |
| `surface-subtle` | Nested data regions | Filters, sub-panels, dense groupings |
| `primary` | Primary interaction / selected state | Trustworthy blue |
| `accent` / `warning` | Cost, attention, annotation | Warm amber, not alarm red |
| `success` | Improvement / reduced load / accepted change | Reserved for positive state, not decoration |
| `destructive` | Removal / risk / failure | Use sparingly and with clear text labels |
| `sidebar-*` | Inverse shell | Dark framing surface for navigation and summary signal |

### Color Rules

- Blue communicates action, selection, and trusted navigation.
- Amber communicates attention, cost, and notes.
- Red is for actual risk or destructive action only.
- Neutral surfaces should stay warm in light mode and slate-driven in dark mode.
- Chart colors should remain distinguishable in both light and dark canvases; prefer the existing five-token sequence.

## Surface Model

- **Canvas:** Ambient gradient with subtle radial light, never flat.
- **Panel:** Frosted card with soft vertical gradient and restrained shadow.
- **Sub-panel:** Higher-density containers inside cards for filters, summary blocks, and drilldowns.
- **Inverse shell:** Sidebar and navigation frame.

Current reusable classes:

- `.report-card`: main elevated panel
- `.surface-panel`: secondary elevated surface
- `.surface-subtle`: inset analytical surface
- `.report-metric-tile`: compact KPI delta tile

## Shape, Spacing, Motion

- **Radius system:** Base radius is soft and rounded. Use `xl` to `2xl` most often.
- **Section spacing:** Default section gap is generous; intra-card spacing is tighter.
- **Hover behavior:** Prefer color, border, and shadow shifts. Avoid scale transforms that move layouts.
- **Motion:** Keep transitions in the `160ms` to `220ms` range with a smooth ease. Respect reduced motion.

## Component Guidance

### Sidebar

- Treat the sidebar as the app's command rail.
- Show navigation, persistent signal, and theme control.
- The sidebar should feel denser and more utilitarian than the hero surface.

### Hero

- Use the hero to frame the current audit story, not to market the product.
- One strong title, one contextual sentence, and metrics that establish business stakes.
- Decorative treatments should stay ambient and behind the content.

### KPI Cards

- Lead with the label, then the number, then the operational detail.
- Fraunces is allowed for major metric values only.
- Cards should compare or contextualize, not simply restate raw numbers.

### Data Tables

- Optimize for scanability first.
- Column labels must read like business concepts.
- Nested pills, note chips, and row hover states should help triage, not decorate.

### Filters And Controls

- Controls should read as analytical instruments: compact, crisp, and obvious.
- Use rounded pills for mode and scenario selection.
- Maintain visible selected states even without hover.

### Dialogs And Sheets

- Use large radii and soft surfaces to keep modal work consistent with the dashboard.
- Forms should stay concise and task-oriented.

## Content Guidance

- Prefer concrete labels: weekly cost, attendee load, top client load, quality notes.
- Tooltips should define the metric or method in one or two sentences.
- Empty states should explain what operational step unblocks the user.
- Avoid decorative headlines that do not add business meaning.

## Accessibility And QA

- Preserve heading order.
- Maintain visible focus rings on all interactive controls.
- Ensure text contrast on muted surfaces remains readable in both themes.
- Provide non-color indicators for state changes when the consequence matters.
- Test responsive behavior at `375`, `768`, `1024`, and `1440`.

## Anti-Patterns

- Generic SaaS marketing styling inside the product experience
- Overuse of bright accent colors
- Oversized cards that reduce information density
- Explanatory UI that describes the dashboard instead of supporting decisions
- Hover interactions that shift surrounding layout
- Treating the schedule builder like a separate product
