// Test API response structure
const API_CONFIG = {
  baseURL: 'https://isn3miewi8.execute-api.us-east-1.amazonaws.com/prod',
  instanceId: 'c6338b37-410e-46b2-90e1-6471228865fd'
}

async function executeQuery(queryName, parameters) {
  const response = await fetch(API_CONFIG.baseURL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queryName,
      parameters: {
        instance_id: API_CONFIG.instanceId,
        ...parameters
      }
    })
  })
  
  return response.json()
}

async function testAPIs() {
  try {
    console.log('🔍 Testing API response structures...\n');
    
    // Test distribution_distbyqueue (we know this works)
    console.log('📊 Testing distribution_distbyqueue:');
    const queueResult = await executeQuery('distribution_distbyqueue', {
      start_datetime: '2025-12-01 00:00:00.00000',
      end_datetime: '2025-12-31 23:59:59.00000'
    });
    
    if (queueResult.status === 'SUCCEEDED' && queueResult.data && queueResult.data.length > 0) {
      console.log('✅ Sample queue data:');
      console.log('Columns:', Object.keys(queueResult.data[0]));
      console.log('Sample:', JSON.stringify(queueResult.data[0], null, 2));
    } else {
      console.log('❌ Queue result:', queueResult);
    }
    
    console.log('\n📞 Testing answered_answeredbyagent:');
    const agentResult = await executeQuery('answered_answeredbyagent', {
      start_datetime: '2025-12-01 00:00:00.00000',
      end_datetime: '2025-12-31 23:59:59.00000',
      queue_id: ['ALL']
    });
    
    console.log('Status:', agentResult.status);
    console.log('Row count:', agentResult.rowCount);
    
    if (agentResult.status === 'SUCCEEDED' && agentResult.data.length > 0) {
      console.log('✅ Sample agent data:');
      console.log('Columns:', Object.keys(agentResult.data[0]));
      console.log('Sample:', JSON.stringify(agentResult.data[0], null, 2));
    } else {
      console.log('❌ No agent data available');
    }
    
    console.log('\n📞 Testing unanswered_unansweredbyqueue:');
    const unansweredResult = await executeQuery('unanswered_unansweredbyqueue', {
      start_datetime: '2025-12-01 00:00:00.00000',
      end_datetime: '2025-12-31 23:59:59.00000'
    });
    
    if (unansweredResult.status === 'SUCCEEDED' && unansweredResult.data.length > 0) {
      console.log('✅ Sample unanswered data:');
      console.log('Columns:', Object.keys(unansweredResult.data[0]));
      console.log('Sample:', JSON.stringify(unansweredResult.data[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPIs();
