# 8. Responsive Design & Accessibility

## 8.1 Adaptive Strategy

NasNetConnect uses an **Adaptive Layout** strategy. Instead of just shrinking the desktop view, we change the navigation and interaction paradigms based on the device class.

### Breakpoint System

| Class | Range | Navigation | Layout |
|-------|-------|------------|--------|
| **Mobile** | < 768px | Bottom Tab Bar | Single Column, Full-width Cards |
| **Tablet** | 768px - 1024px | Rail / Collapsible Sidebar | Two Column (List/Detail) or Grid |
| **Desktop** | > 1024px | Fixed Sidebar (240px) | Multi-Column, Dashboard Grids |

### Layout Adaptations

*   **Navigation:**
    *   *Mobile:* 4-5 core tabs at bottom. Secondary items in "More" drawer.
    *   *Desktop:* Full hierarchical tree in sidebar.
*   **Actions:**
    *   *Mobile:* Floating Action Button (FAB) or Bottom Sheet for context menus.
    *   *Desktop:* Toolbar buttons, inline actions, right-click context menus.
*   **Data Density:**
    *   *Mobile:* Card view (summary). Tap for details.
    *   *Desktop:* Table view (dense). Sort/filter columns.

### Content Priorities (Mobile-First)

1.  **Status:** Is it working? (Green/Red indicators).
2.  **Control:** Turn it on/off (Toggles).
3.  **Metrics:** Throughput/Usage (Sparklines).
4.  **Configuration:** Edit settings (Deep link).

## 8.2 Accessibility (WCAG AAA Goal)

We aim for **WCAG 2.1 AAA** compliance to ensure the tool is usable by everyone, including professional admins with disabilities.

### Color Contrast
*   **Text:** Minimum 7:1 contrast ratio for normal text (AAA).
*   **UI Components:** Minimum 4.5:1 for interactive elements.
*   **Status:** Color is never the *only* indicator. Use icons + text + color.

### Keyboard Navigation
*   **Focus Ring:** High-visibility focus indicators (2px solid ring).
*   **Order:** Logical tab order matches visual flow.
*   **Shortcuts:** `Cmd+K` palette, standard shortcuts (`/` to search, `Esc` to close).
*   **Skip Links:** "Skip to Main Content" for screen readers.

### Focus Management
*   **Modals:** Trap focus within dialogs. Restore focus on close.
*   **Route Change:** Reset focus to page heading or logical start.

### Screen Reader Support
*   **ARIA Labels:** All icon-only buttons have `aria-label`.
*   **Live Regions:** `aria-live` for status updates (e.g., "Connection Successful").
*   **Headings:** Strict h1-h6 hierarchy.

### Motion & Animation
*   **Reduced Motion:** Respect `prefers-reduced-motion` media query. Disable heavy animations.
*   **Duration:** Quick transitions (<300ms).

## 8.3 Internationalization (i18n)

### Language Support
*   Support for 10+ languages (English, Arabic, Persian, French, Spanish, etc.) via `react-i18next`.
*   Namespace per feature (`vpn`, `network`, `common`) to enable code-splitting translations.

### Technical Terms Policy
**Rule:** All technical networking terms remain in **English** regardless of the selected UI language.
*   **Examples:** DHCP, DNS, VPN, WAN, LAN, IP Address, MAC Address, Subnet, Gateway.
*   **Rationale:** Reduces translation risk for safety-critical terms and ensures global searchability for documentation.

### RTL Considerations
*   Full support for Right-to-Left languages (Arabic, Hebrew, Persian).
*   **Strategy:** UI chrome (nav, labels) mirrors for RTL, but **Technical Data** (IPs, Logs, Code) remains LTR English.
*   Layouts flip automatically using logical CSS properties (`margin-inline-start` instead of `margin-left`).

### Font Strategy (Local-First)
*   **Priority 1:** Bundled local fonts (Inter, Vazirmatn, Fira Code) - No network needed.
*   **Priority 2:** CDN Fonts (Google Fonts) - Only if local fails.
*   **Priority 3:** System Fonts (San Francisco, Segoe UI) - Ultimate fallback.
*   **Rationale:** Ensures router UI works perfectly in offline/air-gapped environments.

### Text Handling
*   Designs accommodate variable text length (e.g., German is often longer).
*   No text embedded in images.

## 8.4 Performance Targets

*   **LCP (Largest Contentful Paint):** < 2.5s
*   **FID (First Input Delay):** < 100ms
*   **CLS (Cumulative Layout Shift):** < 0.1
*   **Bundle Size:** < 3MB gzipped (initial load < 500KB).
