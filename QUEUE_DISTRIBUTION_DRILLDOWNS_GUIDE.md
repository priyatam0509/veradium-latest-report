# Queue Distribution Drilldowns - Complete Frontend Integration Guide

## 📋 Overview

**BUG 10:** Queue Distribution tabs need drilldowns  
**Query:** `distribution_distby_drilldown` (ONE query for ALL tabs)  
**Tabs Needing Drilldowns:**
1. By State (NEW - state column now clickable)
2. By Agent
3. By Hour
4. By Day
5. By Month

**Key Point:** Same drilldown query (`qry_distby_drilldown.sql`) supports ALL distribution groupings!

---

## 🎯 What Vince Wants

From the email and screenshots:

1. ✅ **Make data values clickable** in each tab
2. ✅ **Same drilldown modal** for all tabs
3. ✅ **Pass appropriate parameters** based on which tab/value was clicked
4. ✅ **Calculate date ranges** for Hour/Day/Month drilldowns

---

## 🔌 Query: distribution_distby_drilldown

### Parameters

```typescript
{
  instance_id: string;        // Required
  start_datetime: string;     // Required - manipulate based on grouping
  end_datetime: string;       // Required - manipulate based on grouping
  did?: string[];            // Optional
  agent_id?: string[];       // Optional - use for By Agent
  queue_id?: string[];       // Optional
  region?: string[];         // Optional
  state?: string;            // Optional - use for By State (NEW!)
}
```

**Note:** `sla_threshold` and `true_abandon_threshold` removed from latest version

---

## 📱 Tab-by-Tab Implementation

### 1. By State Tab

**Make clickable:** State column  
**Parameter to pass:** `state` (the clicked state value)

```typescript
// src/pages/QueueDistribution/ByStateTab.tsx

const handleStateClick = async (stateValue: string) => {
  const response = await executeQuery({
    queryName: 'distribution_distby_drilldown',
    parameters: {
      instance_id: 'fc8f1921-2aa3-4cf6-8fc4-ad4b42897030',
      start_datetime: filters.startDate,  // From global filters
      end_datetime: filters.endDate,      // From global filters
      region: filters.region,             // From global filters
      state: stateValue  // e.g., "Florida-412"
    },
    username: user?.email,
    waitForResults: true
  });
  
  openDrilldownModal(stateValue, response.data);
};

// In table column definition
{
  key: 'state',
  label: 'State',
  render: (value: string) => (
    <button
      onClick={() => handleStateClick(value)}
      className="text-blue-600 hover:underline cursor-pointer"
    >
      {value}
    </button>
  )
}
```

**Example API Call:**
```json
{
  "instance_id": "fc8f1921-2aa3-4cf6-8fc4-ad4b42897030",
  "start_datetime": "2026-01-01 00:00:00",
  "end_datetime": "2026-03-31 23:59:59",
  "region": ["SFL"],
  "state": "Florida-412"
}
```

---

### 2. By Agent Tab

**Make clickable:** Agent Name column  
**Parameter to pass:** `agent_id` (get from row data)

```typescript
// src/pages/QueueDistribution/ByAgentTab.tsx

interface AgentRow {
  agent_name: string;
  agent_id: string;  // Must be in the data
  // ... other columns
}

const handleAgentClick = async (agentId: string, agentName: string) => {
  const response = await executeQuery({
    queryName: 'distribution_distby_drilldown',
    parameters: {
      instance_id: 'fc8f1921-2aa3-4cf6-8fc4-ad4b42897030',
      start_datetime: filters.startDate,
      end_datetime: filters.endDate,
      region: filters.region,
      agent_id: [agentId]  // Array with single agent
    },
    username: user?.email,
    waitForResults: true
  });
  
  openDrilldownModal(agentName, response.data);
};

// In table column definition
{
  key: 'agent_name',
  label: 'Agent Name',
  render: (value: string, row: AgentRow) => (
    <button
      onClick={() => handleAgentClick(row.agent_id, value)}
      className="text-blue-600 hover:underline cursor-pointer"
    >
      {value}
    </button>
  )
}
```

**Example API Call:**
```json
{
  "instance_id": "fc8f1921-2aa3-4cf6-8fc4-ad4b42897030",
  "start_datetime": "2026-01-01 00:00:00",
  "end_datetime": "2026-03-31 23:59:59",
  "region": ["SFL"],
  "agent_id": ["13e692f1-2821-4a53-b6a9-d05334093ec8"]
}
```

---

### 3. By Hour Tab

**Make clickable:** Hour column  
**Calculate:** start_datetime and end_datetime for that specific hour

```typescript
// src/pages/QueueDistribution/ByHourTab.tsx

interface HourRow {
  date: string;  // "2026-01-06"
  hour: string;  // "19:00 - 19:59"
  // ... other columns
}

const handleHourClick = async (date: string, hour: string) => {
  // Extract hour from "19:00 - 19:59" format
  const hourNumber = hour.split(':')[0];  // "19"
  
  // Calculate date range for that specific hour
  const start_datetime = `${date} ${hourNumber}:00:00`;
  const end_datetime = `${date} ${hourNumber}:59:59`;
  
  const response = await executeQuery({
    queryName: 'distribution_distby_drilldown',
    parameters: {
      instance_id: 'fc8f1921-2aa3-4cf6-8fc4-ad4b42897030',
      start_datetime,
      end_datetime,
      region: filters.region
    },
    username: user?.email,
    waitForResults: true
  });
  
  openDrilldownModal(`${date} ${hour}`, response.data);
};

// In table column definition
{
  key: 'hour',
  label: 'Hour',
  render: (value: string, row: HourRow) => (
    <button
      onClick={() => handleHourClick(row.date, value)}
      className="text-blue-600 hover:underline cursor-pointer"
    >
      {value}
    </button>
  )
}
```

**Example API Call:**
```json
{
  "instance_id": "fc8f1921-2aa3-4cf6-8fc4-ad4b42897030",
  "start_datetime": "2026-01-06 19:00:00",
  "end_datetime": "2026-01-06 19:59:59",
  "region": ["SFL"]
}
```

---

### 4. By Day Tab

**Make clickable:** Date column  
**Calculate:** start_datetime and end_datetime for that full day

```typescript
// src/pages/QueueDistribution/ByDayTab.tsx

const handleDayClick = async (date: string) => {
  // date format: "2026-01-06"
  const start_datetime = `${date} 00:00:00`;
  const end_datetime = `${date} 23:59:59`;
  
  const response = await executeQuery({
    queryName: 'distribution_distby_drilldown',
    parameters: {
      instance_id: 'fc8f1921-2aa3-4cf6-8fc4-ad4b42897030',
      start_datetime,
      end_datetime,
      region: filters.region
    },
    username: user?.email,
    waitForResults: true
  });
  
  openDrilldownModal(date, response.data);
};

// In table column definition
{
  key: 'date',
  label: 'Date',
  render: (value: string) => (
    <button
      onClick={() => handleDayClick(value)}
      className="text-blue-600 hover:underline cursor-pointer"
    >
      {value}
    </button>
  )
}
```

**Example API Call:**
```json
{
  "instance_id": "fc8f1921-2aa3-4cf6-8fc4-ad4b42897030",
  "start_datetime": "2026-01-06 00:00:00",
  "end_datetime": "2026-01-06 23:59:59",
  "region": ["SFL"]
}
```

---

### 5. By Month Tab

**Make clickable:** Month column  
**Calculate:** start_datetime and end_datetime for that full month

```typescript
// src/pages/QueueDistribution/ByMonthTab.tsx

const handleMonthClick = async (month: string) => {
  // month format: "2026-01" or "2026-01-01"
  const [year, monthNum] = month.split('-');
  
  // Calculate first and last day of month
  const start_datetime = `${year}-${monthNum}-01 00:00:00`;
  
  // Get last day of month
  const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
  const end_datetime = `${year}-${monthNum}-${lastDay} 23:59:59`;
  
  const response = await executeQuery({
    queryName: 'distribution_distby_drilldown',
    parameters: {
      instance_id: 'fc8f1921-2aa3-4cf6-8fc4-ad4b42897030',
      start_datetime,
      end_datetime,
      region: filters.region
    },
    username: user?.email,
    waitForResults: true
  });
  
  openDrilldownModal(month, response.data);
};

// In table column definition
{
  key: 'month',
  label: 'Month',
  render: (value: string) => (
    <button
      onClick={() => handleMonthClick(value)}
      className="text-blue-600 hover:underline cursor-pointer"
    >
      {formatMonth(value)}  // Display as "January 2026"
    </button>
  )
}
```

**Example API Call:**
```json
{
  "instance_id": "fc8f1921-2aa3-4cf6-8fc4-ad4b42897030",
  "start_datetime": "2026-01-01 00:00:00",
  "end_datetime": "2026-01-31 23:59:59",
  "region": ["SFL"]
}
```

---

## 🎨 Shared Drilldown Modal

All 5 tabs use the SAME modal component:

```typescript
// src/components/QueueDistribution/DistributionDrilldownModal.tsx

interface DistributionDrilldownModalProps {
  title: string;  // "Florida-412", "Test Ray", "2026-01-06 19:00 - 19:59", etc.
  data: CallDetail[];
  isLoading: boolean;
  onClose: () => void;
}

export const DistributionDrilldownModal = ({ 
  title, 
  data, 
  isLoading, 
  onClose 
}) => {
  return (
    <Modal
      title={`Call Details — ${title}`}
      size="xl"
      onClose={onClose}
    >
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <CallDetailsTable data={data} />
      )}
    </Modal>
  );
};
```

---

## 📊 Response Structure

All drilldowns return the same columns:

```typescript
interface CallDetail {
  did: string;
  contact_id: string;
  agent_name: string;
  date: string;
  queue_name: string;
  region: string;
  state: string;
  customer_number: string;
  channel: string;
  initiation_method: string;
  interaction_status: string;
  agent_connection_attempts: number | null;
  event: string;
  ring_time: string;  // "HH:MM:SS"
  wait_time: string;  // "HH:MM:SS"
  talk_time: string;  // "HH:MM:SS"
  recording: string;  // JSON string
}
```

---

## 💡 Helper Functions

### Date Calculation Utilities

```typescript
// src/utils/dateUtils.ts

/**
 * Get start and end datetime for a specific hour
 */
export const getHourRange = (date: string, hour: string): {
  start_datetime: string;
  end_datetime: string;
} => {
  const hourNumber = hour.split(':')[0].padStart(2, '0');
  return {
    start_datetime: `${date} ${hourNumber}:00:00`,
    end_datetime: `${date} ${hourNumber}:59:59`
  };
};

/**
 * Get start and end datetime for a full day
 */
export const getDayRange = (date: string): {
  start_datetime: string;
  end_datetime: string;
} => {
  return {
    start_datetime: `${date} 00:00:00`,
    end_datetime: `${date} 23:59:59`
  };
};

/**
 * Get start and end datetime for a full month
 */
export const getMonthRange = (yearMonth: string): {
  start_datetime: string;
  end_datetime: string;
} => {
  const [year, month] = yearMonth.split('-');
  const lastDay = new Date(
    parseInt(year), 
    parseInt(month), 
    0
  ).getDate();
  
  return {
    start_datetime: `${year}-${month}-01 00:00:00`,
    end_datetime: `${year}-${month}-${lastDay.toString().padStart(2, '0')} 23:59:59`
  };
};
```

---

## 📝 Complete Implementation Example

```typescript
// src/pages/QueueDistribution/QueueDistributionPage.tsx

import React, { useState } from 'react';
import { DistributionDrilldownModal } from '../../components/QueueDistribution/DistributionDrilldownModal';
import { fetchDistributionDrilldown, CallDetail } from '../../services/queueDistributionService';
import { getHourRange, getDayRange, getMonthRange } from '../../utils/dateUtils';

export const QueueDistributionPage = () => {
  const [activeTab, setActiveTab] = useState('byQueue');
  const [drilldownData, setDrilldownData] = useState<CallDetail[]>([]);
  const [drilldownTitle, setDrilldownTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Generic drilldown handler
  const handleDrilldown = async (
    title: string,
    parameters: any
  ) => {
    setDrilldownTitle(title);
    setIsModalOpen(true);
    setIsLoading(true);

    try {
      const data = await fetchDistributionDrilldown(
        parameters,
        user?.email || ''
      );
      setDrilldownData(data);
    } catch (error) {
      console.error('Failed to load drilldown:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // State drilldown
  const handleStateClick = (state: string) => {
    handleDrilldown(state, {
      instance_id: 'fc8f1921-2aa3-4cf6-8fc4-ad4b42897030',
      start_datetime: filters.startDate,
      end_datetime: filters.endDate,
      region: filters.region,
      state
    });
  };

  // Agent drilldown
  const handleAgentClick = (agentId: string, agentName: string) => {
    handleDrilldown(agentName, {
      instance_id: 'fc8f1921-2aa3-4cf6-8fc4-ad4b42897030',
      start_datetime: filters.startDate,
      end_datetime: filters.endDate,
      region: filters.region,
      agent_id: [agentId]
    });
  };

  // Hour drilldown
  const handleHourClick = (date: string, hour: string) => {
    const { start_datetime, end_datetime } = getHourRange(date, hour);
    handleDrilldown(`${date} ${hour}`, {
      instance_id: 'fc8f1921-2aa3-4cf6-8fc4-ad4b42897030',
      start_datetime,
      end_datetime,
      region: filters.region
    });
  };

  // Day drilldown
  const handleDayClick = (date: string) => {
    const { start_datetime, end_datetime } = getDayRange(date);
    handleDrilldown(date, {
      instance_id: 'fc8f1921-2aa3-4cf6-8fc4-ad4b42897030',
      start_datetime,
      end_datetime,
      region: filters.region
    });
  };

  // Month drilldown
  const handleMonthClick = (month: string) => {
    const { start_datetime, end_datetime } = getMonthRange(month);
    handleDrilldown(month, {
      instance_id: 'fc8f1921-2aa3-4cf6-8fc4-ad4b42897030',
      start_datetime,
      end_datetime,
      region: filters.region
    });
  };

  return (
    <div>
      <h1>Queue Distribution</h1>
      
      <Tabs activeTab={activeTab} onChange={setActiveTab}>
        <Tab id="byQueue" label="By Queue" />
        <Tab id="byDID" label="By DID" />
        <Tab id="byAgent" label="By Agent">
          <ByAgentTab onAgentClick={handleAgentClick} />
        </Tab>
        <Tab id="byHour" label="By Hour">
          <ByHourTab onHourClick={handleHourClick} />
        </Tab>
        <Tab id="byDay" label="By Day">
          <ByDayTab onDayClick={handleDayClick} />
        </Tab>
        <Tab id="byMonth" label="By Month">
          <ByMonthTab onMonthClick={handleMonthClick} />
        </Tab>
        <Tab id="byState" label="By State">
          <ByStateTab onStateClick={handleStateClick} />
        </Tab>
      </Tabs>

      {/* Shared Drilldown Modal */}
      {isModalOpen && (
        <DistributionDrilldownModal
          title={drilldownTitle}
          data={drilldownData}
          isLoading={isLoading}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};
```

---

## ✅ Implementation Checklist

### By State Tab
- [ ] Make State column clickable
- [ ] Pass `state` parameter with exact text value
- [ ] Test with values like "Florida-412", "California", etc.

### By Agent Tab
- [ ] Make Agent Name column clickable
- [ ] Get agent_id from row data
- [ ] Pass `agent_id` as array parameter

### By Hour Tab
- [ ] Make Hour column clickable
- [ ] Extract hour from "HH:00 - HH:59" format
- [ ] Calculate start/end datetime for that hour
- [ ] Test hour range calculation

### By Day Tab
- [ ] Make Date column clickable
- [ ] Calculate start (00:00:00) and end (23:59:59) for full day
- [ ] Test date range calculation

### By Month Tab
- [ ] Make Month column clickable
- [ ] Calculate first and last day of month
- [ ] Handle different month lengths
- [ ] Test month range calculation (including February)

### All Tabs
- [ ] Use same drilldown modal
- [ ] Pass appropriate parameters based on tab
- [ ] Include global filters (region, etc.)
- [ ] Show loading state
- [ ] Handle errors gracefully
- [ ] Display call details table with recordings

---

## 🧪 Testing

Test each drilldown with sample data:

**By State:**
```bash
curl -X POST "https://favxksujk9.execute-api.us-east-1.amazonaws.com/prod/query" -d '{
  "queryName": "distribution_distby_drilldown",
  "parameters": {
    "instance_id": "fc8f1921-2aa3-4cf6-8fc4-ad4b42897030",
    "start_datetime": "2026-01-01 00:00:00",
    "end_datetime": "2026-03-31 23:59:59",
    "region": ["SFL"],
    "state": "Florida-412"
  },
  "username": "testray@TheTicketClinic.com",
  "waitForResults": true
}'
```

---

## 📊 Summary

**Key Points:**
1. ✅ ONE query (`distribution_distby_drilldown`) for ALL tabs
2. ✅ Different parameters based on which tab is active
3. ✅ Calculate date ranges for Hour/Day/Month
4. ✅ Use exact text value for State
5. ✅ Use agent_id (UUID) for Agent
6. ✅ Same modal for all drilldowns

**Ready to implement all 5 drilldowns!** 🚀

---

**End of Guide**
