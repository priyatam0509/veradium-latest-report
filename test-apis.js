/**
 * Comprehensive API Test Script
 * Tests all 15 Athena Reporting APIs
 */

const API_CONFIG = {
  baseURL: 'https://isn3miewi8.execute-api.us-east-1.amazonaws.com/prod',
  instanceId: 'c6338b37-410e-46b2-90e1-6471228865fd'
}

// Date helper
function formatDate(date, isEndDate = false) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  if (isEndDate) {
    return `${year}-${month}-${day} 23:59:59.99999`
  }
  return `${year}-${month}-${day} 00:00:00.00000`
}

function getLastNDays(days) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)
  
  return {
    start: formatDate(start),
    end: formatDate(end, true)
  }
}

// API Client
async function executeQuery(queryName, parameters, waitForResults = true) {
  const response = await fetch(`${API_CONFIG.baseURL}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queryName,
      parameters: {
        instance_id: API_CONFIG.instanceId,
        ...parameters
      },
      waitForResults,
      maxWaitTime: 60
    })
  })

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`)
  }

  return await response.json()
}

// Test results tracker
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
}

function logTest(name, status, details) {
  testResults.total++
  if (status === 'PASS') {
    testResults.passed++
    console.log(`✅ ${name}`)
  } else {
    testResults.failed++
    console.log(`❌ ${name}`)
  }
  
  if (details) {
    console.log(`   ${details}`)
  }
  
  testResults.tests.push({ name, status, details })
}

// Test functions
async function testDistributionByQueue() {
  try {
    const dateRange = getLastNDays(30)
    const result = await executeQuery('distribution_distbyqueue', {
      start_datetime: dateRange.start,
      end_datetime: dateRange.end
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('distribution_distbyqueue', 'PASS', 
        `Returned ${result.rowCount} queues in ${result.executionTime}ms`)
      console.log(`   Columns: ${result.columns.join(', ')}`)
      if (result.data.length > 0) {
        console.log(`   Sample: ${result.data[0].queue_name || result.data[0].queue_id}`)
      }
    } else {
      logTest('distribution_distbyqueue', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('distribution_distbyqueue', 'FAIL', error.message)
  }
}

async function testDistributionByDID() {
  try {
    const dateRange = getLastNDays(30)
    const result = await executeQuery('distribution_distbydid', {
      start_datetime: dateRange.start,
      end_datetime: dateRange.end
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('distribution_distbydid', 'PASS', 
        `Returned ${result.rowCount} DIDs in ${result.executionTime}ms`)
    } else {
      logTest('distribution_distbydid', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('distribution_distbydid', 'FAIL', error.message)
  }
}

async function testDistributionByDay() {
  try {
    const dateRange = getLastNDays(7)
    const result = await executeQuery('distribution_distbyday', {
      start_datetime: dateRange.start,
      end_datetime: dateRange.end
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('distribution_distbyday', 'PASS', 
        `Returned ${result.rowCount} days in ${result.executionTime}ms`)
    } else {
      logTest('distribution_distbyday', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('distribution_distbyday', 'FAIL', error.message)
  }
}

async function testDistributionByMonth() {
  try {
    const start = new Date(2025, 0, 1)
    const end = new Date(2025, 11, 31)
    const result = await executeQuery('distribution_distbymonth', {
      start_datetime: formatDate(start),
      end_datetime: formatDate(end, true)
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('distribution_distbymonth', 'PASS', 
        `Returned ${result.rowCount} months in ${result.executionTime}ms`)
    } else {
      logTest('distribution_distbymonth', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('distribution_distbymonth', 'FAIL', error.message)
  }
}

async function testDistributionByWeek() {
  try {
    const start = new Date(2025, 0, 1)
    const end = new Date(2025, 11, 31)
    const result = await executeQuery('distribution_distbyweek', {
      start_datetime: formatDate(start),
      end_datetime: formatDate(end, true)
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('distribution_distbyweek', 'PASS', 
        `Returned ${result.rowCount} weeks in ${result.executionTime}ms`)
    } else {
      logTest('distribution_distbyweek', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('distribution_distbyweek', 'FAIL', error.message)
  }
}

async function testDistributionByHour() {
  try {
    const today = new Date()
    const result = await executeQuery('distribution_distbyhour', {
      start_datetime: formatDate(today),
      end_datetime: formatDate(today, true)
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('distribution_distbyhour', 'PASS', 
        `Returned ${result.rowCount} hours in ${result.executionTime}ms`)
    } else {
      logTest('distribution_distbyhour', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('distribution_distbyhour', 'FAIL', error.message)
  }
}

async function testDistributionDrilldown() {
  try {
    const dateRange = getLastNDays(7)
    const result = await executeQuery('distribution_distby_drilldown', {
      start_datetime: dateRange.start,
      end_datetime: dateRange.end,
      did: ['ALL'],
      queue_id: ['ALL']
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('distribution_distby_drilldown', 'PASS', 
        `Returned ${result.rowCount} contacts in ${result.executionTime}ms`)
      if (result.data.length > 0) {
        console.log(`   Sample contact: ${result.data[0].contact_id}`)
      }
    } else {
      logTest('distribution_distby_drilldown', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('distribution_distby_drilldown', 'FAIL', error.message)
  }
}

async function testWeekDateRange() {
  try {
    const result = await executeQuery('distribution_distbyweek_getdaterange', {
      week_no: '1',
      year: '2025'
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('distribution_distbyweek_getdaterange', 'PASS', 
        `Returned week date range in ${result.executionTime}ms`)
    } else {
      logTest('distribution_distbyweek_getdaterange', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('distribution_distbyweek_getdaterange', 'FAIL', error.message)
  }
}

async function testAnsweredByQueue() {
  try {
    const dateRange = getLastNDays(30)
    const result = await executeQuery('answered_answeredbyqueue', {
      start_datetime: dateRange.start,
      end_datetime: dateRange.end
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('answered_answeredbyqueue', 'PASS', 
        `Returned ${result.rowCount} queues in ${result.executionTime}ms`)
    } else {
      logTest('answered_answeredbyqueue', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('answered_answeredbyqueue', 'FAIL', error.message)
  }
}

async function testAnsweredByDID() {
  try {
    const dateRange = getLastNDays(30)
    const result = await executeQuery('answered_answeredbydid', {
      start_datetime: dateRange.start,
      end_datetime: dateRange.end
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('answered_answeredbydid', 'PASS', 
        `Returned ${result.rowCount} DIDs in ${result.executionTime}ms`)
    } else {
      logTest('answered_answeredbydid', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('answered_answeredbydid', 'FAIL', error.message)
  }
}

async function testAnsweredByAgent() {
  try {
    const dateRange = getLastNDays(30)
    const result = await executeQuery('answered_answeredbyagent', {
      start_datetime: dateRange.start,
      end_datetime: dateRange.end,
      queue_id: ['ALL']
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('answered_answeredbyagent', 'PASS', 
        `Returned ${result.rowCount} agents in ${result.executionTime}ms`)
      if (result.data.length > 0) {
        console.log(`   Sample agent: ${result.data[0].agent_name}`)
      }
    } else {
      logTest('answered_answeredbyagent', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('answered_answeredbyagent', 'FAIL', error.message)
  }
}

async function testAnsweredDrilldown() {
  try {
    const dateRange = getLastNDays(7)
    const result = await executeQuery('answered_answeredby_drilldown', {
      start_datetime: dateRange.start,
      end_datetime: dateRange.end,
      did: ['ALL'],
      agent_id: ['ALL'],
      queue_id: ['ALL']
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('answered_answeredby_drilldown', 'PASS', 
        `Returned ${result.rowCount} answered contacts in ${result.executionTime}ms`)
    } else {
      logTest('answered_answeredby_drilldown', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('answered_answeredby_drilldown', 'FAIL', error.message)
  }
}

async function testUnansweredByQueue() {
  try {
    const dateRange = getLastNDays(30)
    const result = await executeQuery('unanswered_unansweredbyqueue', {
      start_datetime: dateRange.start,
      end_datetime: dateRange.end
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('unanswered_unansweredbyqueue', 'PASS', 
        `Returned ${result.rowCount} queues in ${result.executionTime}ms`)
    } else {
      logTest('unanswered_unansweredbyqueue', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('unanswered_unansweredbyqueue', 'FAIL', error.message)
  }
}

async function testUnansweredByDID() {
  try {
    const dateRange = getLastNDays(30)
    const result = await executeQuery('unanswered_unansweredbydid', {
      start_datetime: dateRange.start,
      end_datetime: dateRange.end
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('unanswered_unansweredbydid', 'PASS', 
        `Returned ${result.rowCount} DIDs in ${result.executionTime}ms`)
    } else {
      logTest('unanswered_unansweredbydid', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('unanswered_unansweredbydid', 'FAIL', error.message)
  }
}

async function testUnansweredDrilldown() {
  try {
    const dateRange = getLastNDays(7)
    const result = await executeQuery('unanswered_unansweredby_drilldown', {
      start_datetime: dateRange.start,
      end_datetime: dateRange.end,
      did: ['ALL'],
      agent_id: ['ALL'],
      queue_id: ['ALL']
    })
    
    if (result.status === 'SUCCEEDED' && Array.isArray(result.data)) {
      logTest('unanswered_unansweredby_drilldown', 'PASS', 
        `Returned ${result.rowCount} unanswered contacts in ${result.executionTime}ms`)
    } else {
      logTest('unanswered_unansweredby_drilldown', 'FAIL', `Status: ${result.status}`)
    }
  } catch (error) {
    logTest('unanswered_unansweredby_drilldown', 'FAIL', error.message)
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n🧪 Starting API Tests...\n')
  console.log('Base URL:', API_CONFIG.baseURL)
  console.log('Instance ID:', API_CONFIG.instanceId)
  console.log('Date Range: Last 30 days\n')
  console.log('=' .repeat(60))
  
  console.log('\n📊 DISTRIBUTION QUERIES (8)\n')
  await testDistributionByQueue()
  await testDistributionByDID()
  await testDistributionByDay()
  await testDistributionByMonth()
  await testDistributionByWeek()
  await testDistributionByHour()
  await testDistributionDrilldown()
  await testWeekDateRange()
  
  console.log('\n✅ ANSWERED QUERIES (4)\n')
  await testAnsweredByQueue()
  await testAnsweredByDID()
  await testAnsweredByAgent()
  await testAnsweredDrilldown()
  
  console.log('\n❌ UNANSWERED QUERIES (3)\n')
  await testUnansweredByQueue()
  await testUnansweredByDID()
  await testUnansweredDrilldown()
  
  console.log('\n' + '='.repeat(60))
  console.log('\n📈 TEST SUMMARY\n')
  console.log(`Total Tests: ${testResults.total}`)
  console.log(`Passed: ${testResults.passed} ✅`)
  console.log(`Failed: ${testResults.failed} ❌`)
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%\n`)
  
  if (testResults.failed > 0) {
    console.log('\n⚠️  Failed Tests:')
    testResults.tests
      .filter(t => t.status === 'FAIL')
      .forEach(t => console.log(`  - ${t.name}: ${t.details}`))
  }
  
  console.log('\n' + '='.repeat(60) + '\n')
}

// Run tests
runAllTests().catch(console.error)
