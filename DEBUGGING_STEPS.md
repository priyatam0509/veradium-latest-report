# Debugging Steps - Queue Matrix UI

## Steps to Debug Why Data Isn't Showing

### 1. Open Browser Console
1. Navigate to `http://localhost:3001/queues/matrix`
2. Open Developer Tools (F12 or Right-click → Inspect)
3. Go to Console tab
4. Look for these logs:
   - 🔵 fetchQueueData called
   - 📅 Date range: {...}
   - 🌐 Calling API: distribution_distbyqueue
   - 📦 API Result: {...}
   - ✅ Setting queue data: [...]

### 2. Check Network Tab
1. Open Network tab in DevTools
2. Refresh the page
3. Look for request to: `https://isn3miewi8.execute-api.us-east-1.amazonaws.com/prod/query`
4. Check:
   - Status code (should be 200)
   - Response payload
   - Request payload

### 3. Common Issues & Fixes

#### Issue: No console logs at all
**Cause:** Component not mounting or auth guard blocking
**Fix:** Check if you're logged in and on the correct route

#### Issue: API error in console
**Cause:** CORS, network, or API configuration issue
**Fix:** Check the error message in console

#### Issue: Data loads but table is empty
**Cause:** Data structure mismatch
**Fix:** Check the console log "📦 API Result" to see the data structure

#### Issue: "Cannot find module" error
**Cause:** Import path issue
**Fix:** Run `npm install` to ensure dependencies are installed

### 4. Manual Test in Console

Paste this in browser console while on the Queue Matrix page:

```javascript
// Test API directly from browser
const testAPI = async () => {
  const response = await fetch('https://isn3miewi8.execute-api.us-east-1.amazonaws.com/prod/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queryName: 'distribution_distbyqueue',
      parameters: {
        instance_id: 'c6338b37-410e-46b2-90e1-6471228865fd',
        start_datetime: '2025-12-01 00:00:00.00000',
        end_datetime: '2026-01-27 23:59:59.99999'
      },
      waitForResults: true,
      maxWaitTime: 60
    })
  })
  const data = await response.json()
  console.log('Direct API Test:', data)
  return data
}

testAPI()
```

### 5. Check State in React DevTools
1. Install React Developer Tools extension
2. Select the QueueMatrixContent component
3. Check state:
   - `queueData` should have array of queue objects
   - `isLoading` should be false after loading
   - `filteredQueues` should have data

### 6. Verify Route is Correct
Make sure you're navigating to: `/queues/matrix`
Not: `/queue/matrix` or `/queues/` (plural vs singular)
