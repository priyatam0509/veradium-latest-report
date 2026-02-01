/**
 * Script to sync new API-integrated routes to AWS RBAC backend
 * Run: node scripts/sync-routes-to-api.js
 */

const BASE_URL = 'https://vzlfvla5pj.execute-api.us-east-1.amazonaws.com/dev'
const ADMIN_EMAIL = 'piyush@veradium.com'

const NEW_ROUTES = [
  {
    route: '/dashboard/overview',
    label: 'Dashboard Overview',
    allowedRoles: ['ADMIN', 'SUPERVISOR', 'ANALYST'],
    description: 'Dashboard with KPIs, queue performance table, and hourly traffic using distribution APIs'
  },
  {
    route: '/agents/performance',
    label: 'Agent Performance',
    allowedRoles: ['ADMIN', 'SUPERVISOR'],
    description: 'Agent performance matrix with answered_answeredbyagent and drilldown APIs'
  },
  {
    route: '/reports/time-analysis',
    label: 'Time Analysis Reports',
    allowedRoles: ['ADMIN', 'SUPERVISOR', 'ANALYST'],
    description: 'Daily, weekly, and monthly reports using distribution_distbyday, distbyweek, and distbymonth APIs'
  },
  {
    route: '/calls/missed',
    label: 'Missed Calls',
    allowedRoles: ['ADMIN', 'SUPERVISOR'],
    description: 'Missed calls analysis by queue and DID using unanswered APIs'
  }
]

async function apiRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || error.message || 'API request failed')
  }

  return response.json()
}

async function listRoutes() {
  const routes = await apiRequest('/routes/list', {
    method: 'POST',
    body: JSON.stringify({}),
  })
  
  return routes.map(r => ({
    id: r.routeId,
    route: r.route,
    label: r.label,
    allowedRoles: r.allowedRoles,
    isEnabled: r.isEnabled,
  }))
}

async function createRoute(route, label, allowedRoles, description) {
  const response = await apiRequest('/routes', {
    method: 'POST',
    body: JSON.stringify({ 
      requesterEmail: ADMIN_EMAIL, 
      route, 
      label, 
      allowedRoles, 
      description 
    }),
  })
  
  return {
    id: response.routeId,
    route: response.route,
    label: response.label,
    allowedRoles: response.allowedRoles,
    isEnabled: response.isEnabled,
  }
}

async function syncRoutes() {
  console.log('🚀 Starting route sync to AWS RBAC API...\n')
  console.log(`API Base URL: ${BASE_URL}`)
  console.log(`Admin email: ${ADMIN_EMAIL}`)
  console.log(`Routes to add: ${NEW_ROUTES.length}\n`)

  try {
    console.log('📋 Fetching existing routes...')
    const existingRoutes = await listRoutes()
    const existingRoutePaths = existingRoutes.map(r => r.route)
    console.log(`Found ${existingRoutes.length} existing routes\n`)

    let addedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const newRoute of NEW_ROUTES) {
      try {
        if (existingRoutePaths.includes(newRoute.route)) {
          console.log(`⏭️  SKIPPED: ${newRoute.route} (already exists)`)
          skippedCount++
          continue
        }

        console.log(`➕ Adding: ${newRoute.route}`)
        const result = await createRoute(
          newRoute.route,
          newRoute.label,
          newRoute.allowedRoles,
          newRoute.description
        )
        console.log(`   ✅ Success! Route ID: ${result.id}`)
        console.log(`   Label: ${result.label}`)
        console.log(`   Roles: ${result.allowedRoles.join(', ')}\n`)
        addedCount++
      } catch (error) {
        console.error(`   ❌ Failed to add ${newRoute.route}:`, error.message)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 SYNC SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Added: ${addedCount}`)
    console.log(`⏭️  Skipped: ${skippedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📝 Total routes in system: ${existingRoutes.length + addedCount}`)
    console.log('='.repeat(60))

    if (addedCount > 0) {
      console.log('\n✨ Routes successfully synced to AWS RBAC API!')
      console.log('Users can now see these routes in the sidebar based on their role.')
      console.log('\n💡 Next steps:')
      console.log('1. Refresh the application')
      console.log('2. Log in as an admin/supervisor')
      console.log('3. Check the sidebar for new routes')
      console.log('4. Verify routes in RBAC settings: /admin/rbac')
    }

    if (errorCount > 0) {
      console.log('\n⚠️  Some routes failed to sync. Check errors above.')
      process.exit(1)
    }

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error.message)
    console.error('\nPossible issues:')
    console.error('1. Check if NEXT_PUBLIC_AWS_API_URL is set correctly')
    console.error('2. Verify AWS RBAC API is running and accessible')
    console.error('3. Ensure admin email has permission to create routes')
    process.exit(1)
  }
}

syncRoutes()
