# 7. UX Pattern Decisions

## 7.1 Consistency Rules

### Navigation

| Pattern | Decision | Rationale |
|---------|----------|-----------|
| **Adaptive Nav** | Bottom Tabs (Mobile) vs Sidebar (Desktop) | Optimization for thumb zone vs mouse/keyboard. |
| **Back Nav** | Standard header back button | Matches native app expectations. |
| **Deep Links** | Breadcrumbs (Desktop only) | Hierarchy visualization for complex configs. |

### Actions

| Pattern | Decision | Rationale |
|---------|----------|-----------|
| **Primary Action** | Top-right (Header) or Floating (Mobile) | Consistent "Go" button location. |
| **Dangerous Actions** | Red Button + "Safety Gate" Modal | Prevent accidental network drops. |
| **Batch Actions** | Checkbox selection + Action Bar | Efficient management for power users. |

### Forms

| Pattern | Decision | Rationale |
|---------|----------|-----------|
| **Validation** | Zod schema, real-time feedback | Catch errors before submission. |
| **Layout** | Single column (Mobile) vs Grid (Desktop) | Readability and efficient screen use. |
| **Auto-Save** | Drafts saved to local storage | Prevent data loss on refresh/disconnect. |

### Feedback

| Pattern | Decision | Rationale |
|---------|----------|-----------|
| **Success** | Sonner Toast (Bottom-right) | Non-blocking, ephemeral. |
| **Error** | Inline Alert (Forms) or Toast (System) | Contextual error placement. |
| **Loading** | Skeletons (Initial) vs Spinners (Action) | Perceived performance. |
| **Long Jobs** | Async Job Widget (Floating) | Allows user to navigate away while task runs. |

## 7.2 Interaction Patterns

### Safety Pipeline
**Context:** Any configuration change (Firewall, IP, VPN).
1.  **Intent:** User submits form.
2.  **Validation:** Client-side check (Zod).
3.  **Impact Analysis:** Show affected resources (e.g., "This will restart the DHCP server").
4.  **Gate:** "Are you sure?" (if Dangerous/Critical).
5.  **Apply:** Optimistic update in UI.
6.  **Confirm:** Backend confirms success (or rollback).

### Risk Levels
**Context:** Categorizing actions based on potential damage (`FR-DNG-005`).

| Level | Color | Gate Type | Example |
|-------|-------|-----------|---------|
| **Safe** | Blue/Gray | None (Toast) | Changing an icon, label, or description. |
| **Medium** | Amber | Simple Confirm | Changing a non-critical DHCP lease. |
| **Dangerous** | Orange | Explicit Confirm | Modifying Firewall Rules, changing WAN DNS. |
| **Critical** | Red | Countdown + Type "CONFIRM" | Disabling WAN, Factory Reset, changing Admin password. |

### Wizard Flow
**Context:** Setup, Complex Features.
1.  **Steps:** Linear progression (Step 1 of 4).
2.  **Validation:** Block "Next" until step is valid.
3.  **Persistence:** Resume where you left off.

### Diagnostic Wizard
**Context:** Troubleshooting Wizards (`FR-MON-040`).
1.  **Stage 1: Auto-Test:** System runs checks automatically (ping, DNS, etc.).
2.  **Stage 2: Report:** Show Pass/Fail status for each check.
3.  **Stage 3: Recommendation:** "We found X. Do you want to fix it?"
4.  **Stage 4: Fix:** One-click apply.
5.  **Stage 5: Verify:** Re-run tests to confirm resolution.

### Time Travel
**Context:** Reverting configuration to a previous state.
1.  **View:** "History" tab on Resource or System.
2.  **Timeline:** Scrollable list of events ("Update v2.5", "Added VPN").
3.  **Preview:** Clicking an event shows "State at that time" (ReadOnly mode).
4.  **Diff:** "Compare with Current" button shows visual diff.
5.  **Restore:** "Restore this State" triggers Safety Pipeline.

### Resource Lists
**Context:** Interfaces, DHCP Leases, Logs.
1.  **Virtualization:** Handle 1000+ items (TanStack Virtual).
2.  **Filtering:** Client-side fuzzy search.
3.  **Sparklines:** Inline metrics (Traffic) in list view.

### Configuration Drift
**Context:** When the router's actual state differs from NasNet's database (e.g., someone changed settings via WinBox).
1.  **Detection:** Background polling detects mismatch.
2.  **Notification:** "Configuration Drift Detected" warning banner.
3.  **Diff UI:** Visual comparison: "NasNet State" vs "Router Reality".
4.  **Resolution:**
    *   "Import Reality": Update NasNet to match router.
    *   "Enforce Config": Overwrite router to match NasNet.

### Language Switching
**Context:** Changing UI language (e.g., English -> Arabic).
1.  **Action:** Select language from settings.
2.  **Warning:** "Unsaved changes will be lost." (if form dirty).
3.  **Refresh:** **Full Page Reload**.
    *   *Rationale:* Ensures all components/providers re-initialize cleanly with new direction/fonts.
    *   *Persistence:* Language preference saved to LocalStorage.

### Application Updates
**Context:** Installing a new version of NasNetConnect (5-Phase Safety).
1.  **Notification:** "Update Available (v2.5.0)".
2.  **Changelog:** "See what's new" link.
3.  **Check:** "Storage Check" runs (warns if disk space low).
4.  **Progress:** Modal visualizes the 5 phases:
    1.  *Staging:* Downloading (0-100%).
    2.  *Migration:* "Migrating Database...".
    3.  *Switch:* "Swapping binaries..." (Power-safe point).
    4.  *Validation:* "Watchdog Timer: 60s" (Auto-rollback if fails).
    5.  *Commit:* "Cleaning up...".
5.  **Restart:** "Restarting services...".
6.  **Done:** Refresh to dashboard.
7.  **Failure:** If Validation fails, show "Update Failed. Restored v2.4.0 automatically."

## 7.3 Content Patterns

### Voice & Tone
- **Professional:** "Interface Ether1 is down." (Not "Oops, Ether1 broke.")
- **Helpful:** "Check the cable connection." (Actionable advice.)
- **Concise:** Labels are 1-2 words.

### Status Language

| State | Label | Color |
|-------|-------|-------|
| `running` | Online | Green |
| `disabled` | Disabled | Gray |
| `error` | Error | Red |
| `warning` | Degraded | Amber |

## 7.4 Iconography

**Library:** Lucide React
**Usage:**
- **Navigation:** Icon + Label.
- **Actions:** Icon only (with Tooltip).
- **Status:** Colored Icon.

**Key Icons:**
- `Activity`: Dashboard/Status
- `Shield`: Firewall/Security
- `Wifi`: Wireless
- `Network`: Interfaces
- `Settings`: Configuration
- `Save`: Apply/Save
