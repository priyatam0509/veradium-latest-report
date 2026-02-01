# Athena Reporting API - Frontend Integration Guide

## 📊 UI Integration Map

### Dashboard Overview
Use these APIs for your main dashboard:
- **Queue Performance Matrix** → `distribution_distbyqueue`
- **Agent Performance Matrix** → `answered_answeredbyagent`
- **Daily Trend Chart** → `distribution_distbyday`
- **Missed Calls Widget** → `unanswered_unansweredbyqueue`

### Queue Matrix Page
| Component | API | Description |
|-----------|-----|-------------|
| Queue Summary Table | `distribution_distbyqueue` | Main table showing all queue metrics |
| Queue Detail Modal | `distribution_distby_drilldown` | Click on queue row to see contacts |
| Phone Number Stats | `distribution_distbydid` | Tab showing DID performance |
| Time Filters | Pass date range to above APIs | Filter by day/week/month |

### Agent Matrix Page
| Component | API | Description |
|-----------|-----|-------------|
| Agent Performance Table | `answered_answeredbyagent` | Main table with agent metrics |
| Agent Detail Modal | `answered_answeredby_drilldown` | Click on agent to see their calls |
| Queue Filter Dropdown | `answered_answeredbyagent` with queue_id | Filter agents by queue |
| Date Range Picker | Pass dates to above APIs | Custom date ranges |

### Reports Page
| Report Type | API | Use Case |
|-------------|-----|----------|
| Daily Report | `distribution_distbyday` | Daily breakdown table/chart |
| Weekly Report | `distribution_distbyweek` | Weekly trends |
| Monthly Report | `distribution_distbymonth` | Monthly comparison |
| Hourly Report | `distribution_distbyhour` | Intraday traffic pattern |

### Missed Calls Page
| Component | API | Description |
|-----------|-----|-------------|
| Unanswered by Queue | `unanswered_unansweredbyqueue` | Main summary table |
| Unanswered by DID | `unanswered_unansweredbydid` | Phone number breakdown |
| Contact List | `unanswered_unansweredby_drilldown` | Detailed missed calls with filters |

### Contact Details (Drilldown Pages)
| Component | API | Filters |
|-----------|-----|---------|
| All Contacts List | `distribution_distby_drilldown` | `did: ["ALL"], queue_id: ["ALL"]` |
| Queue Contacts | `distribution_distby_drilldown` | `queue_id: ["specific-id"]` |
| DID Contacts | `distribution_distby_drilldown` | `did: ["+1234567890"]` |
| Agent Contacts | `answered_answeredby_drilldown` | `agent_id: ["specific-id"]` |

---

## Base Configuration

```javascript
const API_CONFIG = {
    baseURL: 'https://isn3miewi8.execute-api.us-east-1.amazonaws.com/prod',
    instanceId: 'c6338b37-410e-46b2-90e1-6471228865fd'
};
```

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/query` | Execute Athena query |
| GET | `/query/status/{queryExecutionId}` | Check query status |

---

## 📊 Distribution Queries (8)

### 1.1 Distribution by Queue

**Endpoint:** `POST /query`

**Description:** Get queue statistics (received, answered, abandoned, transferred calls)

**UI Integration:**
- **Page:** Queue Matrix / Dashboard
- **Component:** Main queue performance table
- **Use Case:** Display summary metrics for all queues
- **Refresh:** Every 5 minutes (auto-refresh)
- **Actions:** Click row → Open queue drilldown modal

**Request Body:**
```json
{
    "queryName": "distribution_distbyqueue",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999"
    },
    "waitForResults": true,
    "maxWaitTime": 60
}
```

**Response:**
```json
{
    "queryExecutionId": "6a8e60e4-ec7b-419e-bb5e-09bc665e3458",
    "queryName": "distribution_distbyqueue",
    "status": "SUCCEEDED",
    "executionTime": 7236,
    "columns": ["queue_id", "queue_name", "channel", "initiation_method", "received", "answered", "unanswered", "abandoned", "transferred", "avg_wait", "avg_talk", "max_callers", "%_answered", "%_unanswered", "sla"],
    "data": [
        {
            "queue_id": "0a95e0fd-c0bf-4f57-8e09-a8812fd1bf17",
            "queue_name": "BasicQueue",
            "channel": "Voice",
            "initiation_method": "INBOUND",
            "received": "32",
            "answered": "31",
            "unanswered": "0",
            "abandoned": "0",
            "transferred": "1",
            "avg_wait": "00:00:03",
            "avg_talk": "00:02:46",
            "max_callers": "",
            "%_answered": "96.88 %",
            "%_unanswered": "0.00 %",
            "sla": "96.88 %"
        }
    ],
    "rowCount": 2
}
```

**JavaScript Example:**
```javascript
async function getDistributionByQueue(startDate, endDate) {
    const response = await fetch(`${API_CONFIG.baseURL}/query`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            queryName: 'distribution_distbyqueue',
            parameters: {
                instance_id: API_CONFIG.instanceId,
                start_datetime: startDate,
                end_datetime: endDate
            },
            waitForResults: true
        })
    });
    
    const data = await response.json();
    return data;
}

// Usage
const result = await getDistributionByQueue(
    '2025-12-01 00:00:00.00000',
    '2026-01-01 23:59:59.99999'
);
console.log(result.data); // Array of queue statistics
```

---

### 1.2 Distribution by DID

**Endpoint:** `POST /query`

**Description:** Get statistics by phone number (DID)

**Request Body:**
```json
{
    "queryName": "distribution_distbydid",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999"
    },
    "waitForResults": true
}
```

**JavaScript Example:**
```javascript
async function getDistributionByDID(startDate, endDate) {
    const response = await fetch(`${API_CONFIG.baseURL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            queryName: 'distribution_distbydid',
            parameters: {
                instance_id: API_CONFIG.instanceId,
                start_datetime: startDate,
                end_datetime: endDate
            },
            waitForResults: true
        })
    });
    return await response.json();
}
```

---

### 1.3 Distribution by Day

**Endpoint:** `POST /query`

**Description:** Daily breakdown of call statistics

**Request Body:**
```json
{
    "queryName": "distribution_distbyday",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2025-12-31 23:59:59.99999"
    },
    "waitForResults": true
}
```

**JavaScript Example:**
```javascript
async function getDistributionByDay(startDate, endDate) {
    const response = await fetch(`${API_CONFIG.baseURL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            queryName: 'distribution_distbyday',
            parameters: {
                instance_id: API_CONFIG.instanceId,
                start_datetime: startDate,
                end_datetime: endDate
            },
            waitForResults: true
        })
    });
    return await response.json();
}
```

---

### 1.4 Distribution by Month

**Endpoint:** `POST /query`

**Description:** Monthly breakdown of call statistics

**Request Body:**
```json
{
    "queryName": "distribution_distbymonth",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-01-01 00:00:00.00000",
        "end_datetime": "2025-12-31 23:59:59.99999"
    },
    "waitForResults": true
}
```

**JavaScript Example:**
```javascript
async function getDistributionByMonth(year) {
    const startDate = `${year}-01-01 00:00:00.00000`;
    const endDate = `${year}-12-31 23:59:59.99999`;
    
    const response = await fetch(`${API_CONFIG.baseURL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            queryName: 'distribution_distbymonth',
            parameters: {
                instance_id: API_CONFIG.instanceId,
                start_datetime: startDate,
                end_datetime: endDate
            },
            waitForResults: true
        })
    });
    return await response.json();
}
```

---

### 1.5 Distribution by Week

**Endpoint:** `POST /query`

**Description:** Weekly breakdown of call statistics

**Request Body:**
```json
{
    "queryName": "distribution_distbyweek",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-01-01 00:00:00.00000",
        "end_datetime": "2025-12-31 23:59:59.99999"
    },
    "waitForResults": true
}
```

---

### 1.6 Distribution by Hour

**Endpoint:** `POST /query`

**Description:** Hourly breakdown for a specific day

**Request Body:**
```json
{
    "queryName": "distribution_distbyhour",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-15 00:00:00.00000",
        "end_datetime": "2025-12-15 23:59:59.99999"
    },
    "waitForResults": true
}
```

**JavaScript Example:**
```javascript
async function getDistributionByHour(date) {
    const startDate = `${date} 00:00:00.00000`;
    const endDate = `${date} 23:59:59.99999`;
    
    const response = await fetch(`${API_CONFIG.baseURL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            queryName: 'distribution_distbyhour',
            parameters: {
                instance_id: API_CONFIG.instanceId,
                start_datetime: startDate,
                end_datetime: endDate
            },
            waitForResults: true
        })
    });
    return await response.json();
}

// Usage
const hourlyData = await getDistributionByHour('2025-12-15');
```

---

### 1.7 Distribution Drilldown

**Endpoint:** `POST /query`

**Description:** Contact-level details with filters (queue, DID, date range)

**Request Body - Filter by Queue:**
```json
{
    "queryName": "distribution_distby_drilldown",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999",
        "did": ["ALL"],
        "queue_id": ["0a95e0fd-c0bf-4f57-8e09-a8812fd1bf17"]
    },
    "waitForResults": true
}
```

**Request Body - Filter by DID:**
```json
{
    "queryName": "distribution_distby_drilldown",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999",
        "did": ["+13123246275"],
        "queue_id": ["ALL"]
    },
    "waitForResults": true
}
```

**Request Body - All Contacts:**
```json
{
    "queryName": "distribution_distby_drilldown",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999",
        "did": ["ALL"],
        "queue_id": ["ALL"]
    },
    "waitForResults": true
}
```

**Response:**
```json
{
    "queryExecutionId": "...",
    "queryName": "distribution_distby_drilldown",
    "status": "SUCCEEDED",
    "data": [
        {
            "row_no": "1",
            "did": "+13123246275",
            "contact_id": "abc-123",
            "agent_name": "John Doe",
            "date": "2025-12-15 14:30:00",
            "queue_name": "Support Queue",
            "customer_number": "+1234567890",
            "channel": "Voice",
            "initiation_method": "INBOUND",
            "interation_status": "Completed",
            "agent_connection_attempts": "1",
            "event": "DISCONNECT",
            "ring_time": "00:00:05",
            "wait_time": "00:00:45",
            "talk_time": "00:05:30"
        }
    ],
    "rowCount": 100
}
```

**JavaScript Example:**
```javascript
async function getDistributionDrilldown(filters) {
    const {
        startDate,
        endDate,
        queueId = ['ALL'],
        did = ['ALL']
    } = filters;
    
    const response = await fetch(`${API_CONFIG.baseURL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            queryName: 'distribution_distby_drilldown',
            parameters: {
                instance_id: API_CONFIG.instanceId,
                start_datetime: startDate,
                end_datetime: endDate,
                did: did,
                queue_id: queueId
            },
            waitForResults: true
        })
    });
    return await response.json();
}

// Usage - Filter by queue
const queueDrilldown = await getDistributionDrilldown({
    startDate: '2025-12-01 00:00:00.00000',
    endDate: '2026-01-01 23:59:59.99999',
    queueId: ['0a95e0fd-c0bf-4f57-8e09-a8812fd1bf17']
});

// Usage - Filter by phone number
const didDrilldown = await getDistributionDrilldown({
    startDate: '2025-12-01 00:00:00.00000',
    endDate: '2026-01-01 23:59:59.99999',
    did: ['+13123246275']
});
```

---

### 1.8 Get Week Date Range (Utility)

**Endpoint:** `POST /query`

**Description:** Get start and end dates for a specific week number

**Request Body:**
```json
{
    "queryName": "distribution_distbyweek_getdaterange",
    "parameters": {
        "week_no": "41",
        "year": "2025"
    },
    "waitForResults": true
}
```

**JavaScript Example:**
```javascript
async function getWeekDateRange(weekNumber, year) {
    const response = await fetch(`${API_CONFIG.baseURL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            queryName: 'distribution_distbyweek_getdaterange',
            parameters: {
                week_no: weekNumber.toString(),
                year: year.toString()
            },
            waitForResults: true
        })
    });
    return await response.json();
}

// Usage
const weekRange = await getWeekDateRange(41, 2025);
// Use returned dates for distby_drilldown
```

---

## ✅ Answered Queries (4)

### 2.1 Answered by Queue

**Endpoint:** `POST /query`

**Description:** Answered calls statistics by queue

**Request Body:**
```json
{
    "queryName": "answered_answeredbyqueue",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999"
    },
    "waitForResults": true
}
```

**JavaScript Example:**
```javascript
async function getAnsweredByQueue(startDate, endDate) {
    const response = await fetch(`${API_CONFIG.baseURL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            queryName: 'answered_answeredbyqueue',
            parameters: {
                instance_id: API_CONFIG.instanceId,
                start_datetime: startDate,
                end_datetime: endDate
            },
            waitForResults: true
        })
    });
    return await response.json();
}
```

---

### 2.2 Answered by DID

**Endpoint:** `POST /query`

**Description:** Answered calls statistics by phone number

**Request Body:**
```json
{
    "queryName": "answered_answeredbydid",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999"
    },
    "waitForResults": true
}
```

---

### 2.3 Answered by Agent

**Endpoint:** `POST /query`

**Description:** Agent performance metrics

**Request Body - Specific Queue:**
```json
{
    "queryName": "answered_answeredbyagent",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999",
        "queue_id": ["0a95e0fd-c0bf-4f57-8e09-a8812fd1bf17"]
    },
    "waitForResults": true
}
```

**Request Body - All Queues:**
```json
{
    "queryName": "answered_answeredbyagent",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999",
        "queue_id": ["ALL"]
    },
    "waitForResults": true
}
```

**JavaScript Example:**
```javascript
async function getAnsweredByAgent(startDate, endDate, queueId = ['ALL']) {
    const response = await fetch(`${API_CONFIG.baseURL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            queryName: 'answered_answeredbyagent',
            parameters: {
                instance_id: API_CONFIG.instanceId,
                start_datetime: startDate,
                end_datetime: endDate,
                queue_id: queueId
            },
            waitForResults: true
        })
    });
    return await response.json();
}

// Usage - All queues
const allAgents = await getAnsweredByAgent(
    '2025-12-01 00:00:00.00000',
    '2026-01-01 23:59:59.99999'
);

// Usage - Specific queue
const queueAgents = await getAnsweredByAgent(
    '2025-12-01 00:00:00.00000',
    '2026-01-01 23:59:59.99999',
    ['0a95e0fd-c0bf-4f57-8e09-a8812fd1bf17']
);
```

---

### 2.4 Answered Drilldown

**Endpoint:** `POST /query`

**Description:** Contact-level details for answered calls

**Request Body - Filter by Agent:**
```json
{
    "queryName": "answered_answeredby_drilldown",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999",
        "did": ["ALL"],
        "agent_id": ["f64a6234-ceed-457a-a018-e7f3be817462"],
        "queue_id": ["ALL"]
    },
    "waitForResults": true
}
```

**Request Body - Filter by Queue:**
```json
{
    "queryName": "answered_answeredby_drilldown",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999",
        "did": ["ALL"],
        "agent_id": ["ALL"],
        "queue_id": ["0a95e0fd-c0bf-4f57-8e09-a8812fd1bf17"]
    },
    "waitForResults": true
}
```

**JavaScript Example:**
```javascript
async function getAnsweredDrilldown(filters) {
    const {
        startDate,
        endDate,
        agentId = ['ALL'],
        queueId = ['ALL'],
        did = ['ALL']
    } = filters;
    
    const response = await fetch(`${API_CONFIG.baseURL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            queryName: 'answered_answeredby_drilldown',
            parameters: {
                instance_id: API_CONFIG.instanceId,
                start_datetime: startDate,
                end_datetime: endDate,
                did: did,
                agent_id: agentId,
                queue_id: queueId
            },
            waitForResults: true
        })
    });
    return await response.json();
}

// Usage - Filter by agent
const agentCalls = await getAnsweredDrilldown({
    startDate: '2025-12-01 00:00:00.00000',
    endDate: '2026-01-01 23:59:59.99999',
    agentId: ['f64a6234-ceed-457a-a018-e7f3be817462']
});
```

---

## ❌ Unanswered Queries (3)

### 3.1 Unanswered by Queue

**Endpoint:** `POST /query`

**Description:** Unanswered calls statistics by queue

**Request Body:**
```json
{
    "queryName": "unanswered_unansweredbyqueue",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999"
    },
    "waitForResults": true
}
```

**JavaScript Example:**
```javascript
async function getUnansweredByQueue(startDate, endDate) {
    const response = await fetch(`${API_CONFIG.baseURL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            queryName: 'unanswered_unansweredbyqueue',
            parameters: {
                instance_id: API_CONFIG.instanceId,
                start_datetime: startDate,
                end_datetime: endDate
            },
            waitForResults: true
        })
    });
    return await response.json();
}
```

---

### 3.2 Unanswered by DID

**Endpoint:** `POST /query`

**Description:** Unanswered calls statistics by phone number

**Request Body:**
```json
{
    "queryName": "unanswered_unansweredbydid",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999"
    },
    "waitForResults": true
}
```

---

### 3.3 Unanswered Drilldown

**Endpoint:** `POST /query`

**Description:** Contact-level details for unanswered calls

**Request Body - Filter by Queue:**
```json
{
    "queryName": "unanswered_unansweredby_drilldown",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999",
        "did": ["ALL"],
        "agent_id": ["ALL"],
        "queue_id": ["0a95e0fd-c0bf-4f57-8e09-a8812fd1bf17"]
    },
    "waitForResults": true
}
```

**Request Body - Filter by DID:**
```json
{
    "queryName": "unanswered_unansweredby_drilldown",
    "parameters": {
        "instance_id": "c6338b37-410e-46b2-90e1-6471228865fd",
        "start_datetime": "2025-12-01 00:00:00.00000",
        "end_datetime": "2026-01-01 23:59:59.99999",
        "did": ["+16789199862"],
        "agent_id": ["ALL"],
        "queue_id": ["ALL"]
    },
    "waitForResults": true
}
```

**JavaScript Example:**
```javascript
async function getUnansweredDrilldown(filters) {
    const {
        startDate,
        endDate,
        queueId = ['ALL'],
        did = ['ALL']
    } = filters;
    
    const response = await fetch(`${API_CONFIG.baseURL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            queryName: 'unanswered_unansweredby_drilldown',
            parameters: {
                instance_id: API_CONFIG.instanceId,
                start_datetime: startDate,
                end_datetime: endDate,
                did: did,
                agent_id: ['ALL'],
                queue_id: queueId
            },
            waitForResults: true
        })
    });
    return await response.json();
}

// Usage
const missedCalls = await getUnansweredDrilldown({
    startDate: '2025-12-01 00:00:00.00000',
    endDate: '2026-01-01 23:59:59.99999',
    queueId: ['0a95e0fd-c0bf-4f57-8e09-a8812fd1bf17']
});
```

---

## 🔧 Utility APIs

### Check Query Status

**Endpoint:** `GET /query/status/{queryExecutionId}`

**Description:** Check status of async query

**Request:**
```javascript
async function checkQueryStatus(queryExecutionId) {
    const response = await fetch(
        `${API_CONFIG.baseURL}/query/status/${queryExecutionId}`
    );
    return await response.json();
}
```

**Response:**
```json
{
    "queryExecutionId": "6a8e60e4-ec7b-419e-bb5e-09bc665e3458",
    "status": "SUCCEEDED",
    "submissionDateTime": "2026-01-24T17:30:00Z",
    "completionDateTime": "2026-01-24T17:30:07Z",
    "statistics": {
        "executionTime": 7236,
        "dataScanned": 1048576
    },
    "data": [...],
    "columns": [...],
    "rowCount": 10
}
```

---

### List Available Queries

**Endpoint:** `POST /query`

**Request Body:**
```json
{}
```

**Response:**
```json
{
    "error": "queryName is required",
    "availableQueries": [
        "answered_answeredby_drilldown",
        "answered_answeredbyagent",
        "answered_answeredbydid",
        "answered_answeredbyqueue",
        "distribution_distby_drilldown",
        "distribution_distbyday",
        "distribution_distbydid",
        "distribution_distbyhour",
        "distribution_distbymonth",
        "distribution_distbyqueue",
        "distribution_distbyweek",
        "distribution_distbyweek_getdaterange",
        "unanswered_unansweredby_drilldown",
        "unanswered_unansweredbydid",
        "unanswered_unansweredbyqueue"
    ]
}
```

**JavaScript Example:**
```javascript
async function getAvailableQueries() {
    const response = await fetch(`${API_CONFIG.baseURL}/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
    const data = await response.json();
    return data.availableQueries;
}
```

---

## 📚 Complete API Client

```javascript
class AthenaReportingAPI {
    constructor(config) {
        this.baseURL = config.baseURL;
        this.instanceId = config.instanceId;
    }

    async executeQuery(queryName, parameters, waitForResults = true) {
        const response = await fetch(`${this.baseURL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                queryName,
                parameters: {
                    instance_id: this.instanceId,
                    ...parameters
                },
                waitForResults,
                maxWaitTime: 60
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return await response.json();
    }

    async checkStatus(queryExecutionId) {
        const response = await fetch(
            `${this.baseURL}/query/status/${queryExecutionId}`
        );
        return await response.json();
    }

    // Distribution Queries
    async getDistributionByQueue(startDate, endDate) {
        return this.executeQuery('distribution_distbyqueue', {
            start_datetime: startDate,
            end_datetime: endDate
        });
    }

    async getDistributionByDID(startDate, endDate) {
        return this.executeQuery('distribution_distbydid', {
            start_datetime: startDate,
            end_datetime: endDate
        });
    }

    async getDistributionByDay(startDate, endDate) {
        return this.executeQuery('distribution_distbyday', {
            start_datetime: startDate,
            end_datetime: endDate
        });
    }

    async getDistributionByMonth(startDate, endDate) {
        return this.executeQuery('distribution_distbymonth', {
            start_datetime: startDate,
            end_datetime: endDate
        });
    }

    async getDistributionByWeek(startDate, endDate) {
        return this.executeQuery('distribution_distbyweek', {
            start_datetime: startDate,
            end_datetime: endDate
        });
    }

    async getDistributionByHour(startDate, endDate) {
        return this.executeQuery('distribution_distbyhour', {
            start_datetime: startDate,
            end_datetime: endDate
        });
    }

    async getDistributionDrilldown(startDate, endDate, filters = {}) {
        return this.executeQuery('distribution_distby_drilldown', {
            start_datetime: startDate,
            end_datetime: endDate,
            did: filters.did || ['ALL'],
            queue_id: filters.queueId || ['ALL']
        });
    }

    // Answered Queries
    async getAnsweredByQueue(startDate, endDate) {
        return this.executeQuery('answered_answeredbyqueue', {
            start_datetime: startDate,
            end_datetime: endDate
        });
    }

    async getAnsweredByDID(startDate, endDate) {
        return this.executeQuery('answered_answeredbydid', {
            start_datetime: startDate,
            end_datetime: endDate
        });
    }

    async getAnsweredByAgent(startDate, endDate, queueId = ['ALL']) {
        return this.executeQuery('answered_answeredbyagent', {
            start_datetime: startDate,
            end_datetime: endDate,
            queue_id: queueId
        });
    }

    async getAnsweredDrilldown(startDate, endDate, filters = {}) {
        return this.executeQuery('answered_answeredby_drilldown', {
            start_datetime: startDate,
            end_datetime: endDate,
            did: filters.did || ['ALL'],
            agent_id: filters.agentId || ['ALL'],
            queue_id: filters.queueId || ['ALL']
        });
    }

    // Unanswered Queries
    async getUnansweredByQueue(startDate, endDate) {
        return this.executeQuery('unanswered_unansweredbyqueue', {
            start_datetime: startDate,
            end_datetime: endDate
        });
    }

    async getUnansweredByDID(startDate, endDate) {
        return this.executeQuery('unanswered_unansweredbydid', {
            start_datetime: startDate,
            end_datetime: endDate
        });
    }

    async getUnansweredDrilldown(startDate, endDate, filters = {}) {
        return this.executeQuery('unanswered_unansweredby_drilldown', {
            start_datetime: startDate,
            end_datetime: endDate,
            did: filters.did || ['ALL'],
            agent_id: ['ALL'],
            queue_id: filters.queueId || ['ALL']
        });
    }

    // Utility
    async getAvailableQueries() {
        const response = await fetch(`${this.baseURL}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const data = await response.json();
        return data.availableQueries;
    }
}

// Usage
const api = new AthenaReportingAPI({
    baseURL: 'https://isn3miewi8.execute-api.us-east-1.amazonaws.com/prod',
    instanceId: 'c6338b37-410e-46b2-90e1-6471228865fd'
});

// Get queue statistics
const queueStats = await api.getDistributionByQueue(
    '2025-12-01 00:00:00.00000',
    '2026-01-01 23:59:59.99999'
);

// Get agent performance
const agentPerf = await api.getAnsweredByAgent(
    '2025-12-01 00:00:00.00000',
    '2026-01-01 23:59:59.99999'
);

// Get contact details for specific queue
const contacts = await api.getDistributionDrilldown(
    '2025-12-01 00:00:00.00000',
    '2026-01-01 23:59:59.99999',
    { queueId: ['0a95e0fd-c0bf-4f57-8e09-a8812fd1bf17'] }
);
```

---

## 🎨 React Example

```javascript
import React, { useState, useEffect } from 'react';

const QueueDashboard = () => {
    const [queueStats, setQueueStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const api = new AthenaReportingAPI({
        baseURL: 'https://isn3miewi8.execute-api.us-east-1.amazonaws.com/prod',
        instanceId: 'c6338b37-410e-46b2-90e1-6471228865fd'
    });

    useEffect(() => {
        loadQueueStats();
    }, []);

    const loadQueueStats = async () => {
        try {
            setLoading(true);
            const result = await api.getDistributionByQueue(
                '2025-12-01 00:00:00.00000',
                '2026-01-01 23:59:59.99999'
            );
            setQueueStats(result.data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div>
            <h1>Queue Statistics</h1>
            <table>
                <thead>
                    <tr>
                        <th>Queue</th>
                        <th>Received</th>
                        <th>Answered</th>
                        <th>SLA</th>
                    </tr>
                </thead>
                <tbody>
                    {queueStats.map((queue, index) => (
                        <tr key={index}>
                            <td>{queue.queue_name}</td>
                            <td>{queue.received}</td>
                            <td>{queue.answered}</td>
                            <td>{queue.sla}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default QueueDashboard;
```

---

## 📅 Date Helper Functions

```javascript
class DateHelper {
    // Format date for API
    static formatDate(date, isEndDate = false) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        
        if (isEndDate) {
            return `${year}-${month}-${day} 23:59:59.99999`;
        }
        return `${year}-${month}-${day} 00:00:00.00000`;
    }

    // Get last N days
    static getLastNDays(days) {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - days);
        
        return {
            start: this.formatDate(start),
            end: this.formatDate(end, true)
        };
    }

    // Get this month
    static getThisMonth() {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        return {
            start: this.formatDate(start),
            end: this.formatDate(end, true)
        };
    }

    // Get yesterday
    static getYesterday() {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        
        return {
            start: this.formatDate(yesterday),
            end: this.formatDate(yesterday, true)
        };
    }
}

// Usage
const last30Days = DateHelper.getLastNDays(30);
const thisMonth = DateHelper.getThisMonth();
const yesterday = DateHelper.getYesterday();

// Use in API calls
const stats = await api.getDistributionByQueue(
    last30Days.start,
    last30Days.end
);
```

---

## ⚠️ Error Handling

```javascript
async function handleAPICall(apiFunction) {
    try {
        const result = await apiFunction();
        
        if (result.status === 'FAILED') {
            console.error('Query failed:', result.error);
            return { success: false, error: result.error };
        }
        
        if (result.status === 'SUCCEEDED') {
            return { success: true, data: result.data };
        }
        
        // Query still running (async mode)
        if (result.status === 'RUNNING' || result.status === 'QUEUED') {
            return { 
                success: false, 
                pending: true, 
                queryExecutionId: result.queryExecutionId 
            };
        }
        
    } catch (error) {
        console.error('API Error:', error);
        return { success: false, error: error.message };
    }
}

// Usage
const result = await handleAPICall(() => 
    api.getDistributionByQueue('2025-12-01 00:00:00.00000', '2026-01-01 23:59:59.99999')
);

if (result.success) {
    console.log('Data:', result.data);
} else if (result.pending) {
    console.log('Query pending, check status:', result.queryExecutionId);
} else {
    console.error('Error:', result.error);
}
```

---

## 🔄 Async Query Pattern

```javascript
async function executeAsyncQuery(queryName, parameters) {
    // Submit query
    const submitResult = await api.executeQuery(queryName, parameters, false);
    const queryExecutionId = submitResult.queryExecutionId;
    
    console.log('Query submitted:', queryExecutionId);
    
    // Poll for results
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    
    while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const status = await api.checkStatus(queryExecutionId);
        
        if (status.status === 'SUCCEEDED') {
            return { success: true, data: status.data };
        }
        
        if (status.status === 'FAILED') {
            return { success: false, error: status.error };
        }
        
        attempts++;
    }
    
    return { success: false, error: 'Query timeout' };
}

// Usage
const result = await executeAsyncQuery('distribution_distbyqueue', {
    start_datetime: '2024-01-01 00:00:00.00000',
    end_datetime: '2025-12-31 23:59:59.99999'
});
```

---

## 📝 Summary

**Total APIs: 15 Queries**

**Distribution (8):**
- distbyqueue, distbydid, distbyday, distbymonth, distbyweek, distbyhour
- distby_drilldown, distbyweek_getdaterange

**Answered (4):**
- answeredbyqueue, answeredbydid, answeredbyagent
- answeredby_drilldown

**Unanswered (3):**
- unansweredbyqueue, unansweredbydid
- unansweredby_drilldown

**All queries use:**
- Method: `POST`
- Endpoint: `/query`
- Content-Type: `application/json`
- Authentication: None (public endpoint)

---

## 🎨 Page-by-Page Integration Guide

### Page 1: Dashboard (Home)

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Dashboard - Overview                        │
├─────────────────────────────────────────────┤
│ [Date Range Picker: Last 30 Days]          │
├─────────────────────────────────────────────┤
│ KPI Cards Row:                              │
│ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │Total│ │Ans  │ │Miss │ │SLA  │           │
│ │Calls│ │Calls│ │Calls│ │ %   │           │
│ └─────┘ └─────┘ └─────┘ └─────┘           │
├─────────────────────────────────────────────┤
│ Queue Performance Table (Top 10)            │
│ [Use: distribution_distbyqueue]             │
│ Queue Name | Received | Answered | SLA      │
│ ...                                          │
├─────────────────────────────────────────────┤
│ Hourly Traffic Chart                        │
│ [Use: distribution_distbyhour]              │
│ (Bar chart showing calls by hour)           │
└─────────────────────────────────────────────┘
```

**APIs to Use:**
```javascript
// On page load
const dateRange = DateHelper.getLastNDays(30);

// KPI Cards - Get totals from queue stats
const queueStats = await api.getDistributionByQueue(
    dateRange.start, 
    dateRange.end
);
const totalReceived = queueStats.data.reduce((sum, q) => sum + parseInt(q.received), 0);
const totalAnswered = queueStats.data.reduce((sum, q) => sum + parseInt(q.answered), 0);

// Missed Calls Widget
const missedCalls = await api.getUnansweredByQueue(
    dateRange.start, 
    dateRange.end
);

// Today's hourly traffic
const today = DateHelper.getYesterday(); // or today
const hourlyData = await api.getDistributionByHour(
    today.start,
    today.end
);
```

---

### Page 2: Queue Matrix

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Queue Performance Matrix                    │
├─────────────────────────────────────────────┤
│ [Date Range] [Queue Filter] [Export]       │
├─────────────────────────────────────────────┤
│ Tabs: [By Queue] [By DID] [By Hour]        │
├─────────────────────────────────────────────┤
│ Queue Name  │ Recv │ Ans │ Unans │ Aband   │
│ BasicQueue  │  32  │ 31  │   0   │   0     │
│ Support Q   │ 150  │ 120 │  10   │  20     │
│ [Click row → Show drilldown modal]          │
└─────────────────────────────────────────────┘
```

**Tab 1: By Queue**
```javascript
// Main table
const queueData = await api.getDistributionByQueue(startDate, endDate);

// On row click - show drilldown modal
const handleQueueClick = async (queueId) => {
    const contacts = await api.getDistributionDrilldown(
        startDate,
        endDate,
        { queueId: [queueId] }
    );
    openModal(contacts.data);
};
```

**Tab 2: By DID**
```javascript
const didData = await api.getDistributionByDID(startDate, endDate);

// On row click
const handleDIDClick = async (phoneNumber) => {
    const contacts = await api.getDistributionDrilldown(
        startDate,
        endDate,
        { did: [phoneNumber] }
    );
    openModal(contacts.data);
};
```

**Tab 3: By Hour**
```javascript
// Show hourly breakdown for selected day
const hourlyData = await api.getDistributionByHour(
    selectedDate.start,
    selectedDate.end
);
```

---

### Page 3: Agent Matrix

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Agent Performance Matrix                    │
├─────────────────────────────────────────────┤
│ [Date Range] [Queue: All ▾] [Export]       │
├─────────────────────────────────────────────┤
│ Agent Name   │ Answered │ Avg Talk │ SLA   │
│ John Doe     │    45    │ 00:05:30 │ 95%   │
│ Jane Smith   │    38    │ 00:04:15 │ 92%   │
│ [Click row → Show agent call details]       │
└─────────────────────────────────────────────┘
```

**Implementation:**
```javascript
// Main table - All queues
const agentData = await api.getAnsweredByAgent(
    startDate,
    endDate,
    ['ALL']
);

// Queue filter dropdown change
const handleQueueFilter = async (queueId) => {
    const filteredData = await api.getAnsweredByAgent(
        startDate,
        endDate,
        queueId === 'all' ? ['ALL'] : [queueId]
    );
    updateTable(filteredData.data);
};

// On agent row click
const handleAgentClick = async (agentId) => {
    const agentCalls = await api.getAnsweredDrilldown(
        startDate,
        endDate,
        { agentId: [agentId] }
    );
    openAgentDetailModal(agentCalls.data);
};
```

---

### Page 4: Reports

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Reports                                     │
├─────────────────────────────────────────────┤
│ Report Type: [Daily ▾]                      │
│ Date Range: [Dec 1 - Dec 31]               │
│ [Generate Report]                           │
├─────────────────────────────────────────────┤
│ Daily Calls Report                          │
│ Date       │ Received │ Answered │ SLA     │
│ 2025-12-01 │   120    │   110    │ 92%     │
│ 2025-12-02 │   130    │   115    │ 88%     │
│ ...                                          │
├─────────────────────────────────────────────┤
│ [Chart visualization]                       │
└─────────────────────────────────────────────┘
```

**Report Types:**

**Daily Report:**
```javascript
const dailyReport = await api.getDistributionByDay(
    '2025-12-01 00:00:00.00000',
    '2025-12-31 23:59:59.99999'
);
// Display as table + line chart
```

**Weekly Report:**
```javascript
const weeklyReport = await api.getDistributionByWeek(
    '2025-01-01 00:00:00.00000',
    '2025-12-31 23:59:59.99999'
);
// Display week numbers with stats
```

**Monthly Report:**
```javascript
const monthlyReport = await api.getDistributionByMonth(
    '2025-01-01 00:00:00.00000',
    '2025-12-31 23:59:59.99999'
);
// Display months with comparison
```

---

### Page 5: Missed Calls (Unanswered)

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Missed Calls Analysis                       │
├─────────────────────────────────────────────┤
│ Tabs: [By Queue] [By Phone Number]         │
├─────────────────────────────────────────────┤
│ Queue Name      │ Unanswered │ %           │
│ Support Queue   │     20     │ 15%         │
│ [Click → Show missed call details]          │
└─────────────────────────────────────────────┘
```

**Tab 1: By Queue**
```javascript
const missedByQueue = await api.getUnansweredByQueue(startDate, endDate);

// On row click
const handleMissedQueueClick = async (queueId) => {
    const missedContacts = await api.getUnansweredDrilldown(
        startDate,
        endDate,
        { queueId: [queueId] }
    );
    openMissedCallsModal(missedContacts.data);
};
```

**Tab 2: By DID**
```javascript
const missedByDID = await api.getUnansweredByDID(startDate, endDate);

// On row click
const handleMissedDIDClick = async (phoneNumber) => {
    const missedContacts = await api.getUnansweredDrilldown(
        startDate,
        endDate,
        { did: [phoneNumber] }
    );
    openMissedCallsModal(missedContacts.data);
};
```

---

### Page 6: Contact Details (Drilldown Modal)

**Layout:**
```
┌─────────────────────────────────────────────┐
│ Contact Details - BasicQueue                │
│ Dec 1 - Dec 31                              │
├─────────────────────────────────────────────┤
│ [Export CSV] [Filter: All ▾] [Search]      │
├─────────────────────────────────────────────┤
│ Contact ID │ Agent  │ Customer │ Status    │
│ abc-123    │ John   │ +1-555-  │ Completed │
│ def-456    │ Jane   │ +1-555-  │ Completed │
│ ...                                          │
│ [Pagination: 1 2 3 ... 10]                  │
└─────────────────────────────────────────────┘
```

**Implementation:**
```javascript
// When queue row clicked on Queue Matrix page
const showQueueContacts = async (queueId, queueName) => {
    const contacts = await api.getDistributionDrilldown(
        startDate,
        endDate,
        { queueId: [queueId] }
    );
    
    openModal({
        title: `Contact Details - ${queueName}`,
        data: contacts.data,
        columns: contacts.columns
    });
};

// Filter dropdown
const handleStatusFilter = (status) => {
    const filtered = contacts.data.filter(c => 
        status === 'all' || c.interation_status === status
    );
    updateModalTable(filtered);
};
```

---

## 🔄 Common Patterns

### Pattern 1: Dashboard Widget
```javascript
const DashboardWidget = ({ title, queryFunction }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5 * 60 * 1000); // Refresh every 5 min
        return () => clearInterval(interval);
    }, []);
    
    const loadData = async () => {
        setLoading(true);
        const dateRange = DateHelper.getLastNDays(30);
        const result = await queryFunction(dateRange.start, dateRange.end);
        setData(result.data);
        setLoading(false);
    };
    
    return (
        <div className="widget">
            <h3>{title}</h3>
            {loading ? <Spinner /> : <Table data={data} />}
        </div>
    );
};

// Usage
<DashboardWidget 
    title="Queue Performance"
    queryFunction={api.getDistributionByQueue}
/>
```

### Pattern 2: Table with Drilldown
```javascript
const QueueTable = () => {
    const [queues, setQueues] = useState([]);
    const [selectedQueue, setSelectedQueue] = useState(null);
    const [drilldownData, setDrilldownData] = useState([]);
    
    const handleRowClick = async (queue) => {
        const contacts = await api.getDistributionDrilldown(
            startDate,
            endDate,
            { queueId: [queue.queue_id] }
        );
        setDrilldownData(contacts.data);
        setSelectedQueue(queue);
    };
    
    return (
        <>
            <Table data={queues} onRowClick={handleRowClick} />
            {selectedQueue && (
                <Modal 
                    title={`Contacts - ${selectedQueue.queue_name}`}
                    data={drilldownData}
                    onClose={() => setSelectedQueue(null)}
                />
            )}
        </>
    );
};
```

### Pattern 3: Report with Date Range
```javascript
const ReportPage = () => {
    const [reportType, setReportType] = useState('daily');
    const [dateRange, setDateRange] = useState(DateHelper.getThisMonth());
    const [reportData, setReportData] = useState([]);
    
    const generateReport = async () => {
        let data;
        switch(reportType) {
            case 'daily':
                data = await api.getDistributionByDay(dateRange.start, dateRange.end);
                break;
            case 'weekly':
                data = await api.getDistributionByWeek(dateRange.start, dateRange.end);
                break;
            case 'monthly':
                data = await api.getDistributionByMonth(dateRange.start, dateRange.end);
                break;
        }
        setReportData(data.data);
    };
    
    return (
        <div>
            <select onChange={(e) => setReportType(e.target.value)}>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
            </select>
            <DateRangePicker onChange={setDateRange} />
            <button onClick={generateReport}>Generate</button>
            <ReportTable data={reportData} />
        </div>
    );
};
```

---

## 🎯 Component Library Recommendations

### Recommended Components

**Tables:**
- AG Grid (for large datasets)
- Material-UI DataGrid
- React Table

**Charts:**
- Chart.js / react-chartjs-2 (for hourly/daily trends)
- Recharts (for simple charts)
- ApexCharts (for advanced visualizations)

**Date Pickers:**
- react-datepicker
- Material-UI DatePicker
- Ant Design DatePicker

**Example Integration:**
```javascript
import { BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const HourlyTrafficChart = ({ data }) => {
    // Transform API data for chart
    const chartData = data.map(item => ({
        hour: item.hour,
        calls: parseInt(item.received)
    }));
    
    return (
        <BarChart width={600} height={300} data={chartData}>
            <XAxis dataKey="hour" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="calls" fill="#8884d8" />
        </BarChart>
    );
};
```

---

## 📊 Data Transformation Examples

### Transform Queue Stats for KPI Cards
```javascript
const calculateKPIs = (queueData) => {
    const totals = queueData.reduce((acc, queue) => ({
        received: acc.received + parseInt(queue.received),
        answered: acc.answered + parseInt(queue.answered),
        unanswered: acc.unanswered + parseInt(queue.unanswered),
        abandoned: acc.abandoned + parseInt(queue.abandoned)
    }), { received: 0, answered: 0, unanswered: 0, abandoned: 0 });
    
    const answerRate = (totals.answered / totals.received * 100).toFixed(2);
    const missedRate = ((totals.unanswered + totals.abandoned) / totals.received * 100).toFixed(2);
    
    return {
        totalCalls: totals.received,
        answeredCalls: totals.answered,
        missedCalls: totals.unanswered + totals.abandoned,
        sla: `${answerRate}%`,
        missedRate: `${missedRate}%`
    };
};
```

### Transform for Chart Display
```javascript
const transformForLineChart = (dailyData) => {
    return dailyData.map(day => ({
        date: day.date.split(' ')[0], // Extract date only
        received: parseInt(day.received),
        answered: parseInt(day.answered),
        sla: parseFloat(day.sla)
    }));
};
```

---

## 🚀 Performance Tips

1. **Cache Results:**
```javascript
const cache = new Map();

const getCachedData = async (cacheKey, queryFunction) => {
    if (cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }
    const data = await queryFunction();
    cache.set(cacheKey, data);
    setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000); // 5 min cache
    return data;
};
```

2. **Use Async Queries for Large Date Ranges:**
```javascript
if (daysDifference > 30) {
    // Use async mode
    const result = await api.executeQuery(queryName, params, false);
    // Poll for results
    pollForResults(result.queryExecutionId);
} else {
    // Use sync mode
    const result = await api.executeQuery(queryName, params, true);
}
```

3. **Debounce Date Range Changes:**
```javascript
import { debounce } from 'lodash';

const debouncedLoadData = debounce(loadData, 500);
```

---

---

## 📋 Quick Reference: Page → API Mapping

| Page/Component | API | When to Call |
|----------------|-----|--------------|
| **Dashboard** | | |
| → KPI Cards | `distribution_distbyqueue` | On load, every 5 min |
| → Hourly Chart | `distribution_distbyhour` | On load, date change |
| → Top Queues | `distribution_distbyqueue` | On load, date change |
| → Missed Calls | `unanswered_unansweredbyqueue` | On load, date change |
| **Queue Matrix** | | |
| → Queue Table | `distribution_distbyqueue` | On load, date change |
| → DID Table | `distribution_distbydid` | Tab switch |
| → Hour Table | `distribution_distbyhour` | Tab switch |
| → Queue Drilldown | `distribution_distby_drilldown` | Row click |
| **Agent Matrix** | | |
| → Agent Table | `answered_answeredbyagent` | On load, filter change |
| → Agent Drilldown | `answered_answeredby_drilldown` | Row click |
| **Reports** | | |
| → Daily Report | `distribution_distbyday` | Generate click |
| → Weekly Report | `distribution_distbyweek` | Generate click |
| → Monthly Report | `distribution_distbymonth` | Generate click |
| **Missed Calls** | | |
| → By Queue | `unanswered_unansweredbyqueue` | On load, date change |
| → By DID | `unanswered_unansweredbydid` | Tab switch |
| → Details | `unanswered_unansweredby_drilldown` | Row click |
| **Modals/Drills** | | |
| → Contact List | `distribution_distby_drilldown` | Modal open |
| → Agent Calls | `answered_answeredby_drilldown` | Modal open |
| → Missed Details | `unanswered_unansweredby_drilldown` | Modal open |

---

## 🎯 API Usage by Feature

### Feature: Real-time Dashboard
```javascript
// APIs: distribution_distbyqueue, distribution_distbyhour
// Refresh: Every 5 minutes
// Date Range: Last 30 days (default)
```

### Feature: Queue Performance Analysis
```javascript
// APIs: distribution_distbyqueue, distribution_distby_drilldown
// Refresh: On demand (user clicks)
// Date Range: User selected
```

### Feature: Agent Performance Review
```javascript
// APIs: answered_answeredbyagent, answered_answeredby_drilldown
// Refresh: On demand
// Date Range: User selected (typically last month)
```

### Feature: Missed Calls Investigation
```javascript
// APIs: unanswered_unansweredbyqueue, unanswered_unansweredby_drilldown
// Refresh: On demand
// Date Range: User selected (typically yesterday or last week)
```

### Feature: Historical Reports
```javascript
// APIs: distribution_distbyday, distribution_distbyweek, distribution_distbymonth
// Refresh: On report generation
// Date Range: Custom (user selected)
```

---

## 📱 Mobile/Responsive Considerations

### Dashboard (Mobile)
- Show KPI cards only (4 cards stacked)
- Defer table/chart loading until tab interaction
- Use pagination for long lists

### Queue Matrix (Mobile)
- Horizontal scroll for table
- Tap row → Navigate to detail page (not modal)
- Show top 10 queues only with "View All" button

### Reports (Mobile)
- Chart-first view (table below fold)
- Export CSV for detailed data
- Simplified date picker
