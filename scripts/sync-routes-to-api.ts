/**
 * Script to sync new API-integrated routes to AWS RBAC backend
 * Run this to register the new Dashboard Overview, Agent Performance, Time Reports, and Missed Calls pages
 */

import { awsRBACService } from '../lib/aws-rbac-service'

// Admin email who will create these routes
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

async function syncRoutes() {
  console.log('🚀 Starting route sync to AWS RBAC API...\n')
  console.log(`Admin email: ${ADMIN_EMAIL}`)
  console.log(`Routes to add: ${NEW_ROUTES.length}\n`)

  try {
    // First, list existing routes to check for duplicates
    console.log('📋 Fetching existing routes...')
    const existingRoutes = await awsRBACService.listRoutes()
    const existingRoutePaths = existingRoutes.map(r => r.route)
    console.log(`Found ${existingRoutes.length} existing routes\n`)

    let addedCount = 0
    let skippedCount = 0
    let errorCount = 0

    for (const newRoute of NEW_ROUTES) {
      try {
        // Check if route already exists
        if (existingRoutePaths.includes(newRoute.route)) {
          console.log(`⏭️  SKIPPED: ${newRoute.route} (already exists)`)
          skippedCount++
          continue
        }

        // Add new route via API
        console.log(`➕ Adding: ${newRoute.route}`)
        const result = await awsRBACService.createRoute(
          ADMIN_EMAIL,
          newRoute.route,
          newRoute.label,
          newRoute.allowedRoles,
          newRoute.description
        )
        console.log(`   ✅ Success! Route ID: ${result.id}`)
        console.log(`   Label: ${result.label}`)
        console.log(`   Roles: ${result.allowedRoles.join(', ')}\n`)
        addedCount++
      } catch (error: any) {
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
    }

    if (errorCount > 0) {
      console.log('\n⚠️  Some routes failed to sync. Check errors above.')
      process.exit(1)
    }

  } catch (error: any) {
    console.error('\n❌ FATAL ERROR:', error.message)
    console.error('Stack:', error.stack)
    process.exit(1)
  }
}

// Run the sync
syncRoutes()
