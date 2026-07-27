# Veradium Dashboard — Session Documentation
> Created: 2026-03-27 | Branch: prod (live customer branch)

---

## 1. Project Overview

| Item | Detail |
|------|--------|
| **App** | Veradium Dashboard — call center analytics for TicketClinic |
| **Live URL** | `prod.d38ei16u83cgi7.amplifyapp.com` (AWS Amplify) |
| **Working dir** | `/Users/priyatampiyush/Desktop/dev/ticketclinicprod/veradium-latest-report` |
| **Active branch** | `prod` — all customer changes go here |
| **Framework** | Next.js (App Router) + TypeScript + Tailwind + shadcn/ui |
| **Data source** | AWS Athena via `lib/athena-api.ts` |
| **Auth** | Microsoft MSAL (SSO) |
| **RBAC** | DynamoDB table: `production-rbac-routes` |
| **Customer/PO** | Vince Lachenal — defines requirements, owns all SQL tasks |
| **Developer** | Priyatam Piyush — implements all UI tasks |

---

## 2. Task List — Full Status

Source: `Veradium Dashboard - Project Tasks - Project Tasks.pdf`

### ✅ COMPLETED (this session)

| # | Task | Key Files |
|---|------|-----------|
| 3 | Common controls moved to global top bar (start date, end date, search, queue filter, apply, reset) | `components/dashboard-layout.tsx`, `lib/global-filters-context.tsx` |
| 4 | Tables dynamically resize to viewport height — sticky header, no scrolling to bottom for horizontal scrollbar | All new queue pages |
| 5 | Queue Distribution: multi-select queue filter | `app/queues/distribution/page.tsx` |
| 6 | Queue Distribution: all 7 tabs — By Queue, By DID, By Agent, By Hour, By Day, By Month, By State (placeholder) | `app/queues/distribution/page.tsx` |
| 8 | Queue Distribution: totals row at bottom of every table | `app/queues/distribution/page.tsx` |
| 9 | Queue Distribution: freely sortable columns (click header asc/desc/off) | `app/queues/distribution/page.tsx` |
| 12 | Navigation: reorganized into submenus — Queue Matrix group, Agent Matrix group, Transferred Calls | `components/dashboard-layout.tsx` |
| 13 | Queue Matrix: landing page with links to Queue Distribution, Answered Calls, Unanswered Calls | `app/queues/matrix/page.tsx` |
| 18 | Queue Distribution: renamed from "Queue Performance Metrics" | `app/queues/distribution/page.tsx` |
| 19 | Answered Calls: brand new page at `/queues/answered` — By Queue, By DID, By Agent tabs + drilldowns | `app/queues/answered/page.tsx` |
| 20 | Unanswered Calls: new page at `/queues/unanswered`, renamed from "Unanswered Call Analysis" | `app/queues/unanswered/page.tsx` |
| 21 | Agent Matrix: landing page with links to Agent Activity, Agent Performance, Agent Availability | `app/agents/matrix/page.tsx` |
| 24 | Agent Activity: label updated in nav (points to `/agents/activity-analysis`) | `components/dashboard-layout.tsx` |
| 25 | Agent Performance: label updated in nav (points to `/agents/performance-analysis`) | `components/dashboard-layout.tsx` |
| 26 | Agent Performance: multi-select agent filter | `app/agents/performance-analysis/page.tsx` |
| 27 | Agent Performance: start/end date pickers | `app/agents/performance-analysis/page.tsx` |
| 29 | Agent Availability: inserted under Agent Matrix submenu | `components/dashboard-layout.tsx` |

### ⏳ PENDING — Waiting on Vince's SQL

| # | Task | Notes |
|---|------|-------|
| 2 | Move data source from Datalake to Redshift | In progress (Vince) |
| 7 | Queue Distribution: By State SQL | UI tab exists but disabled (placeholder) |
| 10 | Call Recording: SQL for S3 location | Vince's task |
| 14 | Queue Matrix: Total Answered Calls SQL | |
| 15 | Queue Matrix: Total Unanswered Calls SQL | |
| 16 | Queue Matrix: Service Levels Answered SQL | |
| 17 | Queue Matrix: Service Levels Unanswered SQL | |
| 22 | Agent Matrix: Agent Summary SQL | |
| 23 | Agent Matrix: Agent Totals SQL | |
| 28 | Agent Performance: Drilldown SQL | |
| 30 | Agent Availability: Revisit drilldown | |
| 32 | Contact Traces: Answered Call Details SQL | |
| 33 | Contact Traces: Unanswered Call Details SQL | |
| 34 | Contact Traces: Call Details Drilldown SQL | |

### ❌ SKIPPED — User decision

| # | Task | Reason |
|---|------|-------|
| 1 | Build Project Tasks List | User said skip |
| 11 | Call Recording: UI controls | User said skip |
| 31 | Contact Traces: new page | User said do not build now |

---

## 3. Architecture

### Key Files

| File | Purpose |
|------|---------|
| `components/dashboard-layout.tsx` | Main layout: sidebar nav, sticky header, global filters bar |
| `lib/global-filters-context.tsx` | **NEW** — global filter state shared across all pages |
| `lib/athena-api.ts` | All Athena API calls |
| `lib/auth-types.ts` | RBAC route definitions (`DEFAULT_ROUTES` array) |
| `lib/date-helper.ts` | `DateHelper.formatDateFromDate(date, isEnd?)` |
| `hooks/use-auth.ts` | `user`, `logout`, `accessibleRoutes`, `isLoading` |
| `components/auth-guard.tsx` | Wraps pages to enforce auth |

### Navigation Structure

```
Dashboard Overview          /dashboard/overview
Queue Matrix (landing)      /queues/matrix
  ├ Queue Distribution      /queues/distribution
  ├ Answered Calls          /queues/answered
  └ Unanswered Calls        /queues/unanswered
Agent Matrix (landing)      /agents/matrix
  ├ Agent Activity          /agents/activity-analysis
  ├ Agent Performance       /agents/performance-analysis
  └ Agent Availability      /agents/availability
Transferred Calls           /analytics/transfers
```

Nav is defined in the `NAV_STRUCTURE` array inside `dashboard-layout.tsx`.

Landing pages (`/queues/matrix`, `/agents/matrix`) are hardcoded accessible in `isRouteAccessible()` — they do NOT need a DynamoDB entry. All other new pages need one.

### Page Template Pattern

```tsx
"use client"
export default function SomePage() {
  const { user, isLoading: authLoading } = useAuth()
  const { appliedStartDate, appliedEndDate, appliedSearchTerm, applyVersion } = useGlobalFilters()

  const [data, setData] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [loaded, setLoaded] = useState({})

  // Re-fetch when Apply is clicked in global bar
  useEffect(() => {
    if (!authLoading) {
      setLoaded({}); setData([])
      setTimeout(() => fetchData(true), 0)
    }
  }, [applyVersion])

  // Initial load
  useEffect(() => {
    if (!authLoading) fetchData()
  }, [authLoading, user?.email])

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* NO filter controls here — they're in the global bar */}
      </DashboardLayout>
    </AuthGuard>
  )
}
```

---

## 4. Global Filters Context

**File:** `lib/global-filters-context.tsx`

### What it does

Moves the common controls (date range, queue filter, search) out of individual pages and into the layout so they are truly global — persisting across page navigation.

### State layers

| Layer | Variables | Updated when |
|-------|-----------|--------------|
| Input state | `startDate`, `endDate`, `searchTerm`, `selectedQueues` | User types/picks in the UI |
| Applied state | `appliedStartDate`, `appliedEndDate`, `appliedSearchTerm`, `appliedQueues` | Apply or Reset button clicked |
| Trigger | `applyVersion` (integer) | Increments on Apply/Reset — pages watch this |

### `availableQueues`

The Queue Filter dropdown in the layout needs queue names to show options. The **Queue Distribution page** populates these after it fetches data by calling `setAvailableQueues(names)`. If not yet visited, dropdown shows a hint.

### How pages consume it

```tsx
const {
  appliedStartDate,    // → pass to API calls as start date
  appliedEndDate,      // → pass to API calls as end date
  appliedSearchTerm,   // → use for client-side row filtering
  appliedQueues,       // → use for queue filtering
  applyVersion,        // → watch in useEffect to trigger re-fetch
  setAvailableQueues,  // → call after fetching queue data (distribution page only)
} = useGlobalFilters()
```

### Pages using global filters

- `app/queues/distribution/page.tsx` ✅
- `app/queues/answered/page.tsx` ✅
- `app/queues/unanswered/page.tsx` ✅

### Pages still with local filter state (pre-existing, not updated)

- `app/queues/matrix/queue-matrix-content.tsx`
- `app/queues/matrix/[queueId]/page.tsx`
- `app/agents/performance-analysis/page.tsx`
- `app/agents/activity-analysis/`
- `app/agents/availability/`
- `app/analytics/transfers/`

---

## 5. DynamoDB Routes Added

Table: `production-rbac-routes`

```bash
# Queue Distribution
aws dynamodb put-item --table-name production-rbac-routes --item '{
  "routeId":{"S":"route-a1b2c3d4"}, "route":{"S":"/queues/distribution"},
  "label":{"S":"Queue Distribution"}, "isEnabled":{"S":"true"},
  "allowedRoles":{"L":[{"S":"ADMIN"},{"S":"MANAGER"},{"S":"ANALYST"},{"S":"SUPERVISOR"}]},
  "createdAt":{"S":"2026-03-25T00:00:00.000000Z"}, "updatedAt":{"S":"2026-03-25T00:00:00.000000Z"},
  "description":{"S":"Call distribution by queue, DID, agent, hour, day, and month"}}'

# Answered Calls
aws dynamodb put-item --table-name production-rbac-routes --item '{
  "routeId":{"S":"route-e5f6a7b8"}, "route":{"S":"/queues/answered"},
  "label":{"S":"Answered Calls"}, "isEnabled":{"S":"true"},
  "allowedRoles":{"L":[{"S":"ADMIN"},{"S":"MANAGER"},{"S":"ANALYST"},{"S":"SUPERVISOR"}]},
  "createdAt":{"S":"2026-03-25T00:00:00.000000Z"}, "updatedAt":{"S":"2026-03-25T00:00:00.000000Z"},
  "description":{"S":"Answered call analysis by queue, DID, and agent with drilldowns"}}'

# Unanswered Calls
aws dynamodb put-item --table-name production-rbac-routes --item '{
  "routeId":{"S":"route-c9d0e1f2"}, "route":{"S":"/queues/unanswered"},
  "label":{"S":"Unanswered Calls"}, "isEnabled":{"S":"true"},
  "allowedRoles":{"L":[{"S":"ADMIN"},{"S":"MANAGER"},{"S":"ANALYST"},{"S":"SUPERVISOR"}]},
  "createdAt":{"S":"2026-03-25T00:00:00.000000Z"}, "updatedAt":{"S":"2026-03-25T00:00:00.000000Z"},
  "description":{"S":"Unanswered and abandoned call analysis by queue and DID"}}'

# Agent Matrix
aws dynamodb put-item --table-name production-rbac-routes --item '{
  "routeId":{"S":"route-03a4b5c6"}, "route":{"S":"/agents/matrix"},
  "label":{"S":"Agent Matrix"}, "isEnabled":{"S":"true"},
  "allowedRoles":{"L":[{"S":"ADMIN"},{"S":"MANAGER"},{"S":"ANALYST"},{"S":"SUPERVISOR"}]},
  "createdAt":{"S":"2026-03-25T00:00:00.000000Z"}, "updatedAt":{"S":"2026-03-25T00:00:00.000000Z"},
  "description":{"S":"Agent matrix landing page"}}'
```

> `/queues/matrix` already exists as `route-6a5cbabc` — no change needed.

---

## 6. Remaining Work (Next Session)

When Vince provides SQL, these are the UI tasks that will follow:

1. **Queue Matrix landing page** — plug in Total Answered, Total Unanswered, Service Level numbers (SQL tasks 14-17)
2. **Agent Matrix landing page** — plug in Agent Summary and Agent Totals (SQL tasks 22-23)
3. **Queue Distribution — By State tab** — currently disabled, needs SQL (task 7)
4. **Agent Performance drilldown** — needs SQL (task 28)
5. **Contact Traces page** — brand new page with Answered/Unanswered tabs + drilldown (tasks 31-34) — user said build later
6. **Pre-existing pages** — consider migrating their local filter state to the global context (agent pages, transfers, etc.)
