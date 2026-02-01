# Sync New Routes to AWS RBAC API

## 🎯 Overview
We've added 4 new API-integrated pages to the application. They need to be registered in your AWS RBAC backend so they appear in the sidebar.

## 📋 New Routes to Register

1. **Dashboard Overview** (`/dashboard/overview`)
   - APIs: `distribution_distbyqueue`, `distribution_distbyhour`
   - Roles: ADMIN, SUPERVISOR, ANALYST

2. **Agent Performance** (`/agents/performance`)
   - APIs: `answered_answeredbyagent`, `answered_answeredby_drilldown`
   - Roles: ADMIN, SUPERVISOR

3. **Time Analysis Reports** (`/reports/time-analysis`)
   - APIs: `distribution_distbyday`, `distribution_distbyweek`, `distribution_distbymonth`
   - Roles: ADMIN, SUPERVISOR, ANALYST

4. **Missed Calls** (`/calls/missed`)
   - APIs: `unanswered_unansweredbyqueue`, `unanswered_unansweredbydid`, `unanswered_unansweredby_drilldown`
   - Roles: ADMIN, SUPERVISOR

---

## 🚀 Method 1: Run Sync Script (Recommended)

### Prerequisites
1. Set your AWS RBAC API URL in `.env.local`:
```bash
NEXT_PUBLIC_AWS_API_URL=https://your-api-gateway.execute-api.us-east-1.amazonaws.com/dev
```

2. Ensure your AWS RBAC API is running and accessible

### Run the Script
```bash
cd /Users/pushkarssingh/Downloads/veradium-connect-reports-v2-main
node scripts/sync-routes-to-api.js
```

### Expected Output
```
🚀 Starting route sync to AWS RBAC API...

API Base URL: https://your-api-gateway...
Admin email: piyush@veradium.com
Routes to add: 4

📋 Fetching existing routes...
Found 10 existing routes

➕ Adding: /dashboard/overview
   ✅ Success! Route ID: 11
   Label: Dashboard Overview
   Roles: ADMIN, SUPERVISOR, ANALYST

➕ Adding: /agents/performance
   ✅ Success! Route ID: 12
   ...

============================================================
📊 SYNC SUMMARY
============================================================
✅ Added: 4
⏭️  Skipped: 0
❌ Errors: 0
📝 Total routes in system: 14
============================================================

✨ Routes successfully synced to AWS RBAC API!
```

---

## 🖱️ Method 2: Manual Registration via RBAC Admin UI

If you prefer to add routes manually:

1. **Navigate to RBAC Settings:**
   ```
   http://localhost:3001/admin/rbac
   ```

2. **Click "Add Route" and enter details for each route:**

   **Route 1:**
   - Route: `/dashboard/overview`
   - Label: `Dashboard Overview`
   - Description: `Dashboard with KPIs, queue performance table, and hourly traffic`
   - Allowed Roles: `ADMIN`, `SUPERVISOR`, `ANALYST`
   - Enabled: ✅

   **Route 2:**
   - Route: `/agents/performance`
   - Label: `Agent Performance`
   - Description: `Agent performance matrix with drilldown`
   - Allowed Roles: `ADMIN`, `SUPERVISOR`
   - Enabled: ✅

   **Route 3:**
   - Route: `/reports/time-analysis`
   - Label: `Time Analysis Reports`
   - Description: `Daily, weekly, and monthly reports`
   - Allowed Roles: `ADMIN`, `SUPERVISOR`, `ANALYST`
   - Enabled: ✅

   **Route 4:**
   - Route: `/calls/missed`
   - Label: `Missed Calls`
   - Description: `Missed calls analysis by queue and DID`
   - Allowed Roles: `ADMIN`, `SUPERVISOR`
   - Enabled: ✅

3. **Save each route**

---

## ✅ Verification Steps

After syncing routes:

1. **Refresh the application:**
   ```bash
   # In browser, press Ctrl+Shift+R (or Cmd+Shift+R on Mac)
   ```

2. **Log in as admin/supervisor**

3. **Check sidebar navigation:**
   - You should see 4 new menu items:
     - 🏠 Dashboard Overview
     - 🎧 Agent Performance
     - 📄 Time Analysis Reports
     - 📵 Missed Calls

4. **Verify in RBAC settings:**
   ```
   http://localhost:3001/admin/rbac
   ```
   - All 4 routes should appear in the routes list
   - Check that role assignments are correct

5. **Test access:**
   - Click each new route to verify pages load
   - Check that API data displays correctly
   - Verify drilldown modals work

---

## 🔧 Troubleshooting

### Script fails with "API request failed"
- Check `NEXT_PUBLIC_AWS_API_URL` in `.env.local`
- Verify AWS RBAC API is running
- Confirm network connectivity to API

### Routes don't appear in sidebar
- Clear browser cache and refresh
- Check browser console for errors
- Verify user role has access to the routes
- Check `/admin/rbac` to confirm routes were added

### "Permission denied" error
- Ensure you're logged in as ADMIN
- Check that admin email matches: `piyush@veradium.com`
- Verify admin user exists in AWS RBAC system

### API endpoints return errors
- Check Athena API URL in `@/lib/athena-api.ts`
- Verify instance ID is correct
- Test APIs with `/test-api` page

---

## 📝 Notes

- Routes are automatically enabled after creation
- Local `DEFAULT_ROUTES` in `@/lib/auth-types.ts` already includes these routes as fallback
- RBAC API is the source of truth for production
- Routes can be modified/disabled later via `/admin/rbac`

---

## 🆘 Need Help?

If routes still don't appear after syncing:

1. Check browser DevTools console for errors
2. Verify API calls in Network tab
3. Test individual pages by navigating directly:
   - `/dashboard/overview`
   - `/agents/performance`
   - `/reports/time-analysis`
   - `/calls/missed`

For API testing, use:
```
http://localhost:3001/test-api
```
