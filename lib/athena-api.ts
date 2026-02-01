/**
 * Athena Reporting API Client
 * Based on FRONTEND_API_GUIDE.md
 */

const API_CONFIG = {
  baseURL: 'https://isn3miewi8.execute-api.us-east-1.amazonaws.com/prod',
  instanceId: 'c6338b37-410e-46b2-90e1-6471228865fd'
}

interface QueryParameters {
  instance_id: string
  start_datetime: string
  end_datetime: string
  [key: string]: any
}

interface APIResponse<T = any> {
  queryExecutionId: string
  queryName: string
  status: string
  executionTime?: number
  columns: string[]
  data: T[]
  rowCount: number
  error?: string
}

export class AthenaReportingAPI {
  private baseURL: string
  private instanceId: string

  constructor(config?: { baseURL?: string; instanceId?: string }) {
    this.baseURL = config?.baseURL || API_CONFIG.baseURL
    this.instanceId = config?.instanceId || API_CONFIG.instanceId
  }

  async executeQuery<T = any>(
    queryName: string,
    parameters: Partial<QueryParameters>,
    waitForResults = true,
    maxWaitTime = 60
  ): Promise<APIResponse<T>> {
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
        maxWaitTime
      })
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }

    return await response.json()
  }

  async checkStatus<T = any>(queryExecutionId: string): Promise<APIResponse<T>> {
    const response = await fetch(
      `${this.baseURL}/query/status/${queryExecutionId}`
    )
    return await response.json()
  }

  // Distribution Queries
  async getDistributionByQueue(startDate: string, endDate: string) {
    return this.executeQuery('distribution_distbyqueue', {
      start_datetime: startDate,
      end_datetime: endDate
    })
  }

  async getDistributionByDID(startDate: string, endDate: string) {
    return this.executeQuery('distribution_distbydid', {
      start_datetime: startDate,
      end_datetime: endDate
    })
  }

  async getDistributionByDay(startDate: string, endDate: string) {
    return this.executeQuery('distribution_distbyday', {
      start_datetime: startDate,
      end_datetime: endDate
    })
  }

  async getDistributionByMonth(startDate: string, endDate: string) {
    return this.executeQuery('distribution_distbymonth', {
      start_datetime: startDate,
      end_datetime: endDate
    })
  }

  async getDistributionByWeek(startDate: string, endDate: string) {
    return this.executeQuery('distribution_distbyweek', {
      start_datetime: startDate,
      end_datetime: endDate
    })
  }

  async getDistributionByHour(startDate: string, endDate: string) {
    return this.executeQuery('distribution_distbyhour', {
      start_datetime: startDate,
      end_datetime: endDate
    })
  }

  async getDistributionDrilldown(
    startDate: string,
    endDate: string,
    filters: { did?: string[]; queueId?: string[] } = {}
  ) {
    return this.executeQuery('distribution_distby_drilldown', {
      start_datetime: startDate,
      end_datetime: endDate,
      did: filters.did || ['ALL'],
      queue_id: filters.queueId || ['ALL']
    })
  }

  // Answered Queries
  async getAnsweredByQueue(startDate: string, endDate: string) {
    return this.executeQuery('answered_answeredbyqueue', {
      start_datetime: startDate,
      end_datetime: endDate
    })
  }

  async getAnsweredByDID(startDate: string, endDate: string) {
    return this.executeQuery('answered_answeredbydid', {
      start_datetime: startDate,
      end_datetime: endDate
    })
  }

  async getAnsweredByAgent(startDate: string, endDate: string, queueId: string[] = ['ALL']) {
    return this.executeQuery('answered_answeredbyagent', {
      start_datetime: startDate,
      end_datetime: endDate,
      queue_id: queueId
    })
  }

  async getAnsweredDrilldown(
    startDate: string,
    endDate: string,
    filters: { did?: string[]; agentId?: string[]; queueId?: string[] } = {}
  ) {
    return this.executeQuery('answered_answeredby_drilldown', {
      start_datetime: startDate,
      end_datetime: endDate,
      did: filters.did || ['ALL'],
      agent_id: filters.agentId || ['ALL'],
      queue_id: filters.queueId || ['ALL']
    })
  }

  // Unanswered Queries
  async getUnansweredByQueue(startDate: string, endDate: string) {
    return this.executeQuery('unanswered_unansweredbyqueue', {
      start_datetime: startDate,
      end_datetime: endDate
    })
  }

  async getUnansweredByDID(startDate: string, endDate: string) {
    return this.executeQuery('unanswered_unansweredbydid', {
      start_datetime: startDate,
      end_datetime: endDate
    })
  }

  async getUnansweredDrilldown(
    startDate: string,
    endDate: string,
    filters: { did?: string[]; queueId?: string[] } = {}
  ) {
    return this.executeQuery('unanswered_unansweredby_drilldown', {
      start_datetime: startDate,
      end_datetime: endDate,
      did: filters.did || ['ALL'],
      agent_id: ['ALL'],
      queue_id: filters.queueId || ['ALL']
    })
  }

  // Utility
  async getWeekDateRange(weekNumber: string, year: string) {
    return this.executeQuery('distribution_distbyweek_getdaterange', {
      week_no: weekNumber,
      year: year
    })
  }

  async getAvailableQueries() {
    const response = await fetch(`${this.baseURL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    })
    const data = await response.json()
    return data.availableQueries
  }
}

// Create singleton instance
export const athenaAPI = new AthenaReportingAPI()
