/**
 * Add new routes via local Next.js API
 * Run: node scripts/add-routes-local.js
 */

const NEW_ROUTES = [
  {
    route: '/dashboard/overview',
    label: 'Dashboard Overview',
    allowedRoles: ['ADMIN', 'SUPERVISOR', 'ANALYST']
  },
  {
    route: '/agents/performance',
    label: 'Agent Performance',
    allowedRoles: ['ADMIN', 'SUPERVISOR']
  },
  {
    route: '/reports/time-analysis',
    label: 'Time Analysis Reports',
    allowedRoles: ['ADMIN', 'SUPERVISOR', 'ANALYST']
  },
  {
    route: '/calls/missed',
    label: 'Missed Calls',
    allowedRoles: ['ADMIN', 'SUPERVISOR']
  }
]

async function addRoutes() {
  console.log('🚀 Adding routes via local API...\n')

  let addedCount = 0
  let skippedCount = 0
  let errorCount = 0

  for (const newRoute of NEW_ROUTES) {
    try {
      console.log(`➕ Adding: ${newRoute.route}`)
      
      const response = await fetch('http://localhost:3001/api/routes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRoute),
      })

      if (response.ok) {
        const result = await response.json()
        console.log(`   ✅ Success! ID: ${result.id}`)
        addedCount++
      } else if (response.status === 400) {
        const error = await response.json()
        if (error.error === 'Route already exists') {
          console.log(`   ⏭️  Skipped (already exists)`)
          skippedCount++
        } else {
          console.log(`   ❌ Error: ${error.error}`)
          errorCount++
        }
      } else {
        console.log(`   ❌ HTTP ${response.status}`)
        errorCount++
      }
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Added: ${addedCount}`)
  console.log(`⏭️  Skipped: ${skippedCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log('='.repeat(60))

  if (addedCount > 0) {
    console.log('\n✨ Routes added successfully!')
    console.log('Refresh your browser to see them in the sidebar.')
  }
}

addRoutes()
