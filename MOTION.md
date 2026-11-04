# Dashboard Motion & Interaction Specification (MOTION.md)

> **Document Classification:** Phase 4 Motion Contract & Interaction Parity Log  
> **Evaluation Date:** October 30, 2026  
> **Reference Standard:** `https://demo.codeandchill.store/ambrel/`  
> **Measured Base Easing:** `cubic-bezier(0.22, 1, 0.36, 1)`  

---

## 1. Interaction & Motion Parity Matrix

| Interaction | Trigger | Target Element | Initial State | Final State | Duration | Delay / Stagger | Easing | Interruption & Recovery | Reduced Motion Mode | Evidence & Confidence |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Sidebar Collapse / Expand** | Toggle button (`<` / `>`) click | `DashboardSidebar` | `w: 252px` | `w: 84px` (and reverse) | `280ms` | `0ms` | `cubic-bezier(0.22, 1, 0.36, 1)` | Reversible mid-flight without glitch; label overflow clipped clean | Instant `0ms` width change | **Measured from Reference** (Confidence: 95%) |
| **Card Hover Lift** | Pointer enter card surface | `.panelCard`, `.kpiCard` | `translateY(0)` | `translateY(-2px)`, shadow lift | `200ms` | `0ms` | `ease` | Resets immediately on pointer leave | Zero transform; subtle border color change only | **Measured from Reference** (Confidence: 90%) |
| **Button Active Tap** | Mouse down / touch start | `.newActionButton`, `.iconButton` | `scale(1)` | `scale(0.98)` | `120ms` | `0ms` | `ease` | Releases immediately on mouseup | Zero scale; opacity shift only | **Reference Target** (Confidence: 85%) |
| **Search Dialog Entrance** | `⌘K` or click search pill | `DashboardSearchDialog` | `opacity: 0, scale: 0.98, y: -6px` | `opacity: 1, scale: 1, y: 0` | `180ms` | `0ms` | `cubic-bezier(0.22, 1, 0.36, 1)` | Escape key dismisses instantly; focus trapped | Instant `opacity: 1`, zero scale | **Measured from Reference** (Confidence: 90%) |
| **Search Dialog Exit** | Escape key / backdrop click | `DashboardSearchDialog` | `opacity: 1, scale: 1` | `opacity: 0, scale: 0.98` | `140ms` | `0ms` | `ease-in` | Clean unmount with focus restoration | Instant unmount | **Reference Target** (Confidence: 90%) |
| **`+ New` Menu Dropdown** | Click `+ New` button | `DashboardActionsMenu` | `opacity: 0, y: -4px` | `opacity: 1, y: 0` | `150ms` | `0ms` | `cubic-bezier(0.22, 1, 0.36, 1)` | Outside click or Escape interrupts cleanly | Instant fade | **Measured from Reference** (Confidence: 90%) |
| **Theme Switch Transition** | Toggle theme button | `:root`, `.dashboardRoot` | `--dash-*` tokens | New theme palette | `200ms` | `0ms` | `ease` | Token swap across canvas, sidebar & cards | Instant token change without duration | **Measured from Reference** (Confidence: 95%) |
| **KPI Shimmer Skeleton** | Asynchronous data loading | `.skeletonBar` | `background-pos: 200% 0` | `background-pos: -200% 0` | `1500ms` | Infinite loop | `linear` | Automatically replaced when real data settles | Static neutral background, zero shimmer | **Implementation Guardrail** |
| **Chart Bar Entrance** | On data arrival | `SalesOverviewChart` | Bar height `0` | Full proportional height | `450ms` | `0ms` | `ease-out` | Non-blocking SVG render | Immediate static bars | **Implementation Guardrail** |

---

## 2. Accessibility & Reduced Motion Contract

All animations in [components/dashboard/dashboard.module.css](file:///Users/ideaind/Desktop/hotel-pos-system-main/components/dashboard/dashboard.module.css) strictly respect the user's operating system preferences via:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- Financial numbers and receipt values are **never** animated in a manner that displays intermediate misleading figures.
- Dialog and modal focus trap correctly restores focus to the invoking search pill or button upon closing.
