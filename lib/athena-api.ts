/**
 * Athena Reporting API Client - V4 with Region Filter Support
 * Based on TICKET-CLINIC-FRONTEND-INTEGRATION-GUIDE.md
 * Updated: February 26, 2026
 * Total Queries: 22
 * 
 * FIXES APPLIED:
 * - Updated API endpoints to new Ticket Clinic URLs
 * - Added region filter support (manual + username-based)
 * - Added 4 NEW queries (transfers, disconnection cause, call disposition, pause detail)
 * - CRITICAL FIX: Drilldown queries now omit ["ALL"] parameters instead of sending them
 */

const API_CONFIG = {
  baseURL: 'https://favxksujk9.execute-api.us-east-1.amazonaws.com/prod',
  instanceId: 'fc8f1921-2aa3-4cf6-8fc4-ad4b42897030',
  userRegionAPI: 'https://4aeeztzo8c.execute-api.us-east-1.amazonaws.com/prod/user-region'
}

interface QueryParameters {
  instance_id: string
  start_datetime: string
  end_datetime: string
  region?: string[]
  username?: string
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
  appliedRegion?: string[] | null
  error?: string
}

export class AthenaReportingAPI {
  private baseURL: string
  private instanceId: string
  private userRegionAPI: string

  constructor(config?: { baseURL?: string; instanceId?: string; userRegionAPI?: string }) {
    this.baseURL = config?.baseURL || API_CONFIG.baseURL
    this.instanceId = config?.instanceId || API_CONFIG.instanceId
    this.userRegionAPI = config?.userRegionAPI || API_CONFIG.userRegionAPI
  }

  async executeQuery<T = any>(
    queryName: string,
    parameters: Partial<QueryParameters>,
    waitForResults = true,
    maxWaitTime: number = 60,
    username?: string
  ): Promise<APIResponse<T>> {
    let params = {
      instance_id: this.instanceId,
      ...parameters
    };
    // Always fetch user region if username is provided
    if (username) {
      try {
        // Normalize all usernames to use '@TheTicketClinic.com' domain
        const normalizedUsername = username.replace(/@.*$/, '@TheTicketClinic.com');
        const regionResult = await this.getUserRegion(normalizedUsername);
        if (regionResult && regionResult.region) {
          // If region is 'ALL', omit region from params
          if (regionResult.region === 'ALL') {
            delete params.region;
          } else {
            params.region = [regionResult.region];
          }
        }
      } catch (err) {
        console.warn('[AthenaAPI] Failed to fetch user region, proceeding without region filter:', err);
      }
    }
    // Remove any array parameter with value ['ALL']
    const paramsObj = params as Record<string, any>;
    Object.keys(paramsObj).forEach(key => {
      if (Array.isArray(paramsObj[key]) && paramsObj[key].length === 1 && paramsObj[key][0] === 'ALL') {
        delete paramsObj[key];
      }
    });
    const payload: any = {
      queryName,
      parameters: params,
      waitForResults,
      maxWaitTime
    };
    if (username) {
      payload.username = username;
    }
    const response = await fetch(`${this.baseURL}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }
    return await response.json();
  }

  async checkStatus<T = any>(queryExecutionId: string): Promise<APIResponse<T>> {
    const response = await fetch(
      `${this.baseURL}/query/status/${queryExecutionId}`
    )
    return await response.json()
  }

  // Distribution Queries (8 queries - all support region filter)
  async getDistributionByQueue(startDate: string, endDate: string, _region?: string[] | null, username?: string) {
  const params: any = {
    start_datetime: startDate,
    end_datetime: endDate,
    sla_threshold: '30',
    true_abandon_threshold: '30'
  }
  // region param is ignored, always fetched from username
  return this.executeQuery('distribution_distbyqueue', params, true, 60, username)
  }

  async getDistributionByDID(startDate: string, endDate: string, _region?: string[] | null, username?: string) {
  const params: any = {
    start_datetime: startDate,
    end_datetime: endDate,
    sla_threshold: '30',
    true_abandon_threshold: '30'
  }
  return this.executeQuery('distribution_distbydid', params, true, 60, username)
  }

  async getDistributionByDay(startDate: string, endDate: string, _region?: string[] | null, username?: string) {
  const params: any = {
    start_datetime: startDate,
    end_datetime: endDate,
    sla_threshold: '30',
    true_abandon_threshold: '30'
  }
  return this.executeQuery('distribution_distbyday', params, true, 60, username)
  }

  async getDistributionByMonth(startDate: string, endDate: string, _region?: string[] | null, username?: string) {
  const params: any = {
    start_datetime: startDate,
    end_datetime: endDate,
    sla_threshold: '30',
    true_abandon_threshold: '30'
  }
  return this.executeQuery('distribution_distbymonth', params, true, 60, username)
  }

  async getDistributionByWeek(startDate: string, endDate: string, _region?: string[] | null, username?: string) {
  const params: any = {
    start_datetime: startDate,
    end_datetime: endDate,
    sla_threshold: '30',
    true_abandon_threshold: '30'
  }
  return this.executeQuery('distribution_distbyweek', params, true, 60, username)
  }

  async getDistributionByHour(startDate: string, endDate: string, _region?: string[] | null, username?: string) {
  const params: any = {
    start_datetime: startDate,
    end_datetime: endDate,
    sla_threshold: '30',
    true_abandon_threshold: '30'
  }
  return this.executeQuery('distribution_distbyhour', params, true, 60, username)
  }

  /**
   * FIXED: Drilldown now omits ["ALL"] parameters instead of sending them
   * The SQL queries don't handle ["ALL"] - they need specific values or omitted parameters
   */
  async getDistributionDrilldown(
    startDate: string,
    endDate: string,
    filters: { did?: string[]; queueId?: string[] } = {},
    _region?: string[] | null,
    username?: string
  ) {
    // Only did and queue_id are supported for this query
    const params: any = {
      start_datetime: startDate,
      end_datetime: endDate,
      sla_threshold: '30',
      true_abandon_threshold: '30'
    }
    if (filters.did && filters.did.length > 0 && filters.did[0] !== 'ALL') {
      params.did = filters.did
    }
    if (filters.queueId && filters.queueId.length > 0 && filters.queueId[0] !== 'ALL') {
      params.queue_id = filters.queueId
    }
    // region param is ignored, always fetched from username
    return this.executeQuery('distribution_distby_drilldown', params, true, 60, username)
  }

  async getWeekDateRange(weekNumber: string, year: string) {
    return this.executeQuery('distribution_distbyweek_getdaterange', {
      week_no: weekNumber,
      year: year
    })
  }

  // Answered Queries (5 queries - all support region filter)
  async getAnsweredByQueue(startDate: string, endDate: string, _region?: string[] | null, username?: string) {
  const params: any = { start_datetime: startDate, end_datetime: endDate }
  return this.executeQuery('answered_answeredbyqueue', params, true, 60, username)
  }

  async getAnsweredByDID(startDate: string, endDate: string, _region?: string[] | null, username?: string) {
  const params: any = { start_datetime: startDate, end_datetime: endDate }
  return this.executeQuery('answered_answeredbydid', params, true, 60, username)
  }

  async getAnsweredByAgent(startDate: string, endDate: string, queueId?: string[], _region?: string[] | null, username?: string) {
    const params: any = { start_datetime: startDate, end_datetime: endDate }
    
    // Only add queue_id if a specific value is provided (not ["ALL"])
    if (queueId && queueId.length > 0 && queueId[0] !== 'ALL') {
      params.queue_id = queueId
    }
    
  return this.executeQuery('answered_answeredbyagent', params, true, 60, username)
  }

  /**
   * FIXED: Drilldown now omits ["ALL"] parameters instead of sending them
   */
  async getAnsweredDrilldown(
    startDate: string,
    endDate: string,
    filters: { did?: string[]; agentId?: string[]; queueId?: string[] } = {},
    _region?: string[] | null,
    username?: string
  ) {
    // Only did, agent_id, and queue_id are supported for this query
    const params: any = {
      start_datetime: startDate,
      end_datetime: endDate,
      sla_threshold: '30',
      true_abandon_threshold: '30'
    }
    if (filters.did && filters.did.length > 0 && filters.did[0] !== 'ALL') {
      params.did = filters.did
    }
    if (filters.agentId && filters.agentId.length > 0 && filters.agentId[0] !== 'ALL') {
      params.agent_id = filters.agentId
    }
    if (filters.queueId && filters.queueId.length > 0 && filters.queueId[0] !== 'ALL') {
      params.queue_id = filters.queueId
    }
    return this.executeQuery('answered_answeredby_drilldown', params, true, 60, username)
  }

  /**
   * NEW QUERY: Get transfer statistics by agent
   */
  async getAnsweredTransfers(startDate: string, endDate: string, _region?: string[] | null, username?: string) {
  const params: any = { start_datetime: startDate, end_datetime: endDate }
  return this.executeQuery('answered_answered_transfers', params, true, 60, username)
  }

  // Unanswered Queries (4 queries - all support region filter)
  async getUnansweredByQueue(startDate: string, endDate: string, _region?: string[] | null, username?: string) {
  const params: any = { start_datetime: startDate, end_datetime: endDate }
  return this.executeQuery('unanswered_unansweredbyqueue', params, true, 60, username)
  }

  async getUnansweredByDID(startDate: string, endDate: string, _region?: string[] | null, username?: string) {
  const params: any = { start_datetime: startDate, end_datetime: endDate }
  return this.executeQuery('unanswered_unansweredbydid', params, true, 60, username)
  }

  /**
   * FIXED: Drilldown now omits ["ALL"] parameters instead of sending them
   */
  async getUnansweredDrilldown(
    startDate: string,
    endDate: string,
    filters: { did?: string[]; queueId?: string[] } = {},
    _region?: string[] | null,
    username?: string
  ) {
    // Only did and queue_id are supported for this query; agent_id is NOT supported and must not be sent
    const params: any = {
      start_datetime: startDate,
      end_datetime: endDate,
      sla_threshold: '30',
      true_abandon_threshold: '30'
    }
    if (filters.did && filters.did.length > 0 && filters.did[0] !== 'ALL') {
      params.did = filters.did
    }
    if (filters.queueId && filters.queueId.length > 0 && filters.queueId[0] !== 'ALL') {
      params.queue_id = filters.queueId
    }
    // agent_id is not supported for unanswered drilldown, do not send
    return this.executeQuery('unanswered_unansweredby_drilldown', params, true, 60, username)
  }

  /**
   * NEW QUERY: Get disconnection reasons for unanswered calls
   */
  async getUnansweredDisconnectionCause(startDate: string, endDate: string, _region?: string[] | null, username?: string) {
  const params: any = { start_datetime: startDate, end_datetime: endDate }
  return this.executeQuery('unanswered_unanswered_disconnection_cause', params, true, 60, username)
  }

  // Agent Queries (3 queries now support region filter)
  async getAgentAvailability(startDate: string, endDate: string, username?: string) {
    return this.executeQuery('agent_agent_avail', {
      start_datetime: startDate,
      end_datetime: endDate
    }, true, 60, username)
  }

  /**
   * Get call disposition statistics by agent (supports region filter)
   */
  async getAgentCallDisposition(startDate: string, endDate: string, username?: string) {
    return this.executeQuery('agent_agent_call_dispostion', {
      start_datetime: startDate,
      end_datetime: endDate
    }, true, 60, username)
  }

  /**
   * Get agent pause/hold statistics (supports region filter)
   */
  async getAgentPauseDetail(startDate: string, endDate: string, username?: string) {
    return this.executeQuery('agent_agent_pause_detail', {
      start_datetime: startDate,
      end_datetime: endDate
    }, true, 60, username)
  }

  // Agent drilldown - no region filter support
  async getAgentDrilldown(startDate: string, endDate: string, agentId?: string) {
    const params: any = {
      start_datetime: startDate,
      end_datetime: endDate
    }
    if (agentId) params.agent_id = [agentId]
    return this.executeQuery('agent_agent_drilldown', params)
  }

  // ── V6 Dashboard Queries ────────────────────────────────────────────────

  /** Total answered calls summary — dashboard_total_answered_calls */
  async getDashboardTotalAnswered(startDate: string, endDate: string, username?: string) {
    return this.executeQuery('dashboard_total_answered_calls', {
      start_datetime: startDate,
      end_datetime: endDate
    }, true, 60, username)
  }

  /** Total unanswered calls summary — dashboard_total_unanswered_calls */
  async getDashboardTotalUnanswered(startDate: string, endDate: string, username?: string) {
    return this.executeQuery('dashboard_total_unanswered_calls', {
      start_datetime: startDate,
      end_datetime: endDate
    }, true, 60, username)
  }

  /** Answered service level distribution — dashboard_answered_service_level */
  async getDashboardAnsweredServiceLevel(startDate: string, endDate: string, username?: string) {
    return this.executeQuery('dashboard_answered_service_level', {
      start_datetime: startDate,
      end_datetime: endDate
    }, true, 60, username)
  }

  /** Abandoned service level distribution — dashboard_abandoned_service_level */
  async getDashboardAbandonedServiceLevel(startDate: string, endDate: string, username?: string) {
    return this.executeQuery('dashboard_abandoned_service_level', {
      start_datetime: startDate,
      end_datetime: endDate
    }, true, 60, username)
  }

  // ── V6 Lookup Queries ───────────────────────────────────────────────────

  /** Get list of agents for dropdowns — lookup_agentlist */
  async getLookupAgentList(username?: string) {
    return this.executeQuery('lookup_agentlist', {}, true, 60, username)
  }

  /** Get list of queues for dropdowns — lookup_queuelist */
  async getLookupQueueList(username?: string) {
    return this.executeQuery('lookup_queuelist', {}, true, 60, username)
  }

  // ── V6 Distribution by State ────────────────────────────────────────────

  /** Call distribution by state/area-code — distribution_distbystate */
  async getDistributionByState(startDate: string, endDate: string, _region?: string[] | null, username?: string) {
    const params: any = {
      start_datetime: startDate,
      end_datetime: endDate,
      sla_threshold: '30',
      true_abandon_threshold: '30'
    }
    return this.executeQuery('distribution_distbystate', params, true, 60, username)
  }

  // RBAC Query (1 query - NO region filter support)
  async getUsers(searchFirstName = '', searchLastName = '', searchEmail = '') {
    return this.executeQuery('rbac_users_rbac', {
      search_first_name: searchFirstName,
      search_last_name: searchLastName,
      search_email: searchEmail
    })
  }

  // Utility Methods
  async getUserRegion(username: string) {
  // Normalize all usernames to use '@TheTicketClinic.com' domain
  const normalizedUsername = username.replace(/@.*$/, '@TheTicketClinic.com');
  const response = await fetch(`${this.userRegionAPI}?username=${normalizedUsername}`)
    return await response.json()
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
