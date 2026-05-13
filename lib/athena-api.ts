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
    // Fetch user region from API ONLY as a fallback — if the caller already
    // set params.region explicitly (from the global filter), respect that and
    // do NOT overwrite it with the user-lookup result.
    if (username) {
      const callerSuppliedRegion = Array.isArray((parameters as any).region) && (parameters as any).region.length > 0
      if (!callerSuppliedRegion) {
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
  async getDistributionByQueue(startDate: string, endDate: string, region?: string[] | null, username?: string, queueIds?: string[], agentIds?: string[], dids?: string[]) {
  const params: any = {
    start_datetime: startDate,
    end_datetime: endDate,
    sla_threshold: '30',
    true_abandon_threshold: '30'
  }
  if (queueIds && queueIds.length > 0) params.queue_id = queueIds
  if (agentIds && agentIds.length > 0) params.agent_id = agentIds
  if (dids && dids.length > 0) params.did = dids
  if (region && region.length > 0) params.region = region
  return this.executeQuery('distribution_distbyqueue', params, true, 60, username)
  }

  async getDistributionByDID(startDate: string, endDate: string, region?: string[] | null, username?: string, queueIds?: string[], agentIds?: string[], dids?: string[]) {
  const params: any = {
    start_datetime: startDate,
    end_datetime: endDate,
    sla_threshold: '30',
    true_abandon_threshold: '30'
  }
  if (queueIds && queueIds.length > 0) params.queue_id = queueIds
  if (agentIds && agentIds.length > 0) params.agent_id = agentIds
  if (dids && dids.length > 0) params.did = dids
  if (region && region.length > 0) params.region = region
  return this.executeQuery('distribution_distbydid', params, true, 60, username)
  }

  async getDistributionByDay(startDate: string, endDate: string, region?: string[] | null, username?: string, queueIds?: string[], agentIds?: string[], dids?: string[]) {
  const params: any = {
    start_datetime: startDate,
    end_datetime: endDate,
    sla_threshold: '30',
    true_abandon_threshold: '30'
  }
  if (queueIds && queueIds.length > 0) params.queue_id = queueIds
  if (agentIds && agentIds.length > 0) params.agent_id = agentIds
  if (dids && dids.length > 0) params.did = dids
  if (region && region.length > 0) params.region = region
  return this.executeQuery('distribution_distbyday', params, true, 60, username)
  }

  async getDistributionByMonth(startDate: string, endDate: string, region?: string[] | null, username?: string, queueIds?: string[], agentIds?: string[], dids?: string[]) {
  const params: any = {
    start_datetime: startDate,
    end_datetime: endDate,
    sla_threshold: '30',
    true_abandon_threshold: '30'
  }
  if (queueIds && queueIds.length > 0) params.queue_id = queueIds
  if (agentIds && agentIds.length > 0) params.agent_id = agentIds
  if (dids && dids.length > 0) params.did = dids
  if (region && region.length > 0) params.region = region
  return this.executeQuery('distribution_distbymonth', params, true, 60, username)
  }

  async getDistributionByWeek(startDate: string, endDate: string, region?: string[] | null, username?: string, queueIds?: string[], agentIds?: string[], dids?: string[]) {
  const params: any = {
    start_datetime: startDate,
    end_datetime: endDate,
    sla_threshold: '30',
    true_abandon_threshold: '30'
  }
  if (queueIds && queueIds.length > 0) params.queue_id = queueIds
  if (agentIds && agentIds.length > 0) params.agent_id = agentIds
  if (dids && dids.length > 0) params.did = dids
  if (region && region.length > 0) params.region = region
  return this.executeQuery('distribution_distbyweek', params, true, 60, username)
  }

  async getDistributionByHour(startDate: string, endDate: string, region?: string[] | null, username?: string, queueIds?: string[], agentIds?: string[], dids?: string[]) {
  const params: any = {
    start_datetime: startDate,
    end_datetime: endDate,
    sla_threshold: '30',
    true_abandon_threshold: '30'
  }
  if (queueIds && queueIds.length > 0) params.queue_id = queueIds
  if (agentIds && agentIds.length > 0) params.agent_id = agentIds
  if (dids && dids.length > 0) params.did = dids
  if (region && region.length > 0) params.region = region
  return this.executeQuery('distribution_distbyhour', params, true, 60, username)
  }

  async getDistributionByAgent(startDate: string, endDate: string, region?: string[] | null, username?: string, queueIds?: string[], agentIds?: string[], dids?: string[]) {
  const params: any = {
    start_datetime: startDate,
    end_datetime: endDate,
    sla_threshold: '30',
    true_abandon_threshold: '30'
  }
  if (queueIds && queueIds.length > 0) params.queue_id = queueIds
  if (agentIds && agentIds.length > 0) params.agent_id = agentIds
  if (dids && dids.length > 0) params.did = dids
  if (region && region.length > 0) params.region = region
  return this.executeQuery('distribution_distbyagent', params, true, 60, username)
  }

  /**
   * FIXED: Drilldown now omits ["ALL"] parameters instead of sending them
   * The SQL queries don't handle ["ALL"] - they need specific values or omitted parameters
   */
  async getDistributionDrilldown(
    startDate: string,
    endDate: string,
    filters: { did?: string[]; queueId?: string[]; agentId?: string[]; state?: string } = {},
    region?: string[] | null,
    username?: string
  ) {
    const params: any = {
      start_datetime: startDate,
      end_datetime: endDate,
    }
    if (filters.did && filters.did.length > 0 && filters.did[0] !== 'ALL') {
      params.did = filters.did
    }
    if (filters.queueId && filters.queueId.length > 0 && filters.queueId[0] !== 'ALL') {
      params.queue_id = filters.queueId
    }
    if (filters.agentId && filters.agentId.length > 0) {
      params.agent_id = filters.agentId
    }
    if (filters.state) {
      params.state = filters.state
    }
    if (region && region.length > 0) params.region = region
    return this.executeQuery('distribution_distby_drilldown', params, true, 60, username)
  }

  async getWeekDateRange(weekNumber: string, year: string) {
    return this.executeQuery('distribution_distbyweek_getdaterange', {
      week_no: weekNumber,
      year: year
    })
  }

  // Answered Queries (5 queries - all support region filter)
  async getAnsweredByQueue(startDate: string, endDate: string, region?: string[] | null, username?: string, queueIds?: string[], agentIds?: string[], dids?: string[]) {
  const params: any = { start_datetime: startDate, end_datetime: endDate }
  if (queueIds && queueIds.length > 0) params.queue_id = queueIds
  if (agentIds && agentIds.length > 0) params.agent_id = agentIds
  if (dids && dids.length > 0) params.did = dids
  if (region && region.length > 0) params.region = region
  return this.executeQuery('answered_answeredbyqueue', params, true, 60, username)
  }

  async getAnsweredByDID(startDate: string, endDate: string, region?: string[] | null, username?: string, queueIds?: string[], agentIds?: string[], dids?: string[]) {
  const params: any = { start_datetime: startDate, end_datetime: endDate }
  if (queueIds && queueIds.length > 0) params.queue_id = queueIds
  if (agentIds && agentIds.length > 0) params.agent_id = agentIds
  if (dids && dids.length > 0) params.did = dids
  if (region && region.length > 0) params.region = region
  return this.executeQuery('answered_answeredbydid', params, true, 60, username)
  }

  async getAnsweredByAgent(startDate: string, endDate: string, queueId?: string[], region?: string[] | null, username?: string, agentIds?: string[], dids?: string[]) {
    const params: any = { start_datetime: startDate, end_datetime: endDate }
    if (queueId && queueId.length > 0 && queueId[0] !== 'ALL') {
      params.queue_id = queueId
    }
    if (agentIds && agentIds.length > 0) params.agent_id = agentIds
    if (dids && dids.length > 0) params.did = dids
    if (region && region.length > 0) params.region = region
  return this.executeQuery('answered_answeredbyagent', params, true, 60, username)
  }

  /**
   * FIXED: Drilldown now omits ["ALL"] parameters instead of sending them
   */
  async getAnsweredDrilldown(
    startDate: string,
    endDate: string,
    filters: { did?: string[]; agentId?: string[]; queueId?: string[] } = {},
    region?: string[] | null,
    username?: string
  ) {
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
    if (region && region.length > 0) params.region = region
    return this.executeQuery('answered_answeredby_drilldown', params, true, 60, username)
  }

  /**
   * NEW QUERY: Get transfer statistics by agent
   */
  async getAnsweredTransfers(startDate: string, endDate: string, region?: string[] | null, username?: string, agentIds?: string[], queueIds?: string[], dids?: string[]) {
  const params: any = { start_datetime: startDate, end_datetime: endDate }
  if (agentIds && agentIds.length > 0) params.agent_id = agentIds
  if (queueIds && queueIds.length > 0) params.queue_id = queueIds
  if (dids && dids.length > 0) params.did = dids
  if (region && region.length > 0) params.region = region
  return this.executeQuery('answered_answered_transfers', params, true, 60, username)
  }

  async getUnansweredByQueue(startDate: string, endDate: string, region?: string[] | null, username?: string, queueIds?: string[], dids?: string[]) {
  const params: any = { start_datetime: startDate, end_datetime: endDate }
  if (queueIds && queueIds.length > 0) params.queue_id = queueIds
  if (dids && dids.length > 0) params.did = dids
  if (region && region.length > 0) params.region = region
  return this.executeQuery('unanswered_unansweredbyqueue', params, true, 60, username)
  }

  async getUnansweredByDID(startDate: string, endDate: string, region?: string[] | null, username?: string, queueIds?: string[], dids?: string[]) {
  const params: any = { start_datetime: startDate, end_datetime: endDate }
  if (queueIds && queueIds.length > 0) params.queue_id = queueIds
  if (dids && dids.length > 0) params.did = dids
  if (region && region.length > 0) params.region = region
  return this.executeQuery('unanswered_unansweredbydid', params, true, 60, username)
  }

  /**
   * FIXED: Drilldown now omits ["ALL"] parameters instead of sending them
   */
  async getUnansweredDrilldown(
    startDate: string,
    endDate: string,
    filters: { did?: string[]; queueId?: string[] } = {},
    region?: string[] | null,
    username?: string
  ) {
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
    if (region && region.length > 0) params.region = region
    return this.executeQuery('unanswered_unansweredby_drilldown', params, true, 60, username)
  }

  /**
   * NEW QUERY: Get disconnection reasons for unanswered calls
   */
  async getUnansweredDisconnectionCause(startDate: string, endDate: string, region?: string[] | null, username?: string) {
  const params: any = { start_datetime: startDate, end_datetime: endDate }
  return this.executeQuery('unanswered_unanswered_disconnection_cause', params, true, 60, username)
  }

  // Agent Queries (3 queries now support region filter)
  async getAgentAvailability(startDate: string, endDate: string, username?: string, agentIds?: string[], queueIds?: string[], region?: string[] | null) {
    const params: any = { start_datetime: startDate, end_datetime: endDate }
    if (agentIds && agentIds.length > 0) params.agent_id = agentIds
    if (queueIds && queueIds.length > 0) params.queue_id = queueIds
    if (region && region.length > 0) params.region = region
    return this.executeQuery('agent_agent_avail', params, true, 90, username)
  }

  async getAgentCallDisposition(startDate: string, endDate: string, username?: string, agentIds?: string[], queueIds?: string[], region?: string[] | null) {
    const params: any = { start_datetime: startDate, end_datetime: endDate }
    if (agentIds && agentIds.length > 0) params.agent_id = agentIds
    if (queueIds && queueIds.length > 0) params.queue_id = queueIds
    if (region && region.length > 0) params.region = region
    return this.executeQuery('agent_agent_call_dispostion', params, true, 60, username)
  }

  async getAgentPauseDetail(startDate: string, endDate: string, username?: string, agentIds?: string[], region?: string[] | null) {
    const params: any = { start_datetime: startDate, end_datetime: endDate }
    if (agentIds && agentIds.length > 0) params.agent_id = agentIds
    if (region && region.length > 0) params.region = region
    return this.executeQuery('agent_agent_pause_detail', params, true, 60, username)
  }

  // Agent availability drilldown
  async getAgentDrilldown(startDate: string, endDate: string, agentId?: string, username?: string) {
    const params: any = {
      start_datetime: startDate,
      end_datetime: endDate
    }
    if (agentId) params.agent_id = [agentId]
    return this.executeQuery('agent_agent_drilldown', params, true, 60, username)
  }

  // Agent performance drilldown — agent_agent_performance_drilldown
  async getAgentPerformanceDrilldown(startDate: string, endDate: string, agentId: string, queueIds?: string[], username?: string) {
    const params: any = {
      start_datetime: startDate,
      end_datetime: endDate,
      agent_id: [agentId],
    }
    if (queueIds && queueIds.length > 0) params.queue_id = queueIds
    return this.executeQuery('agent_agent_performance_drilldown', params, true, 60, username)
  }

  // ── V6 Dashboard Queries ────────────────────────────────────────────────

  /** Total answered calls summary — dashboard_total_answered_calls */
  async getDashboardTotalAnswered(startDate: string, endDate: string, username?: string, queueIds?: string[], dids?: string[], region?: string[] | null) {
    const params: any = { start_datetime: startDate, end_datetime: endDate }
    if (queueIds && queueIds.length > 0) params.queue_id = queueIds
    if (dids && dids.length > 0) params.did = dids
    if (region && region.length > 0) params.region = region
    return this.executeQuery('dashboard_total_answered_calls', params, true, 60, username)
  }

  async getDashboardTotalUnanswered(startDate: string, endDate: string, username?: string, queueIds?: string[], dids?: string[], region?: string[] | null) {
    const params: any = { start_datetime: startDate, end_datetime: endDate }
    if (queueIds && queueIds.length > 0) params.queue_id = queueIds
    if (dids && dids.length > 0) params.did = dids
    if (region && region.length > 0) params.region = region
    return this.executeQuery('dashboard_total_unanswered_calls', params, true, 60, username)
  }

  async getDashboardAnsweredServiceLevel(startDate: string, endDate: string, username?: string, queueIds?: string[], dids?: string[], region?: string[] | null) {
    const params: any = { start_datetime: startDate, end_datetime: endDate }
    if (queueIds && queueIds.length > 0) params.queue_id = queueIds
    if (dids && dids.length > 0) params.did = dids
    if (region && region.length > 0) params.region = region
    return this.executeQuery('dashboard_answered_service_level', params, true, 60, username)
  }

  async getDashboardAbandonedServiceLevel(startDate: string, endDate: string, username?: string, queueIds?: string[], dids?: string[], region?: string[] | null) {
    const params: any = { start_datetime: startDate, end_datetime: endDate }
    if (queueIds && queueIds.length > 0) params.queue_id = queueIds
    if (dids && dids.length > 0) params.did = dids
    if (region && region.length > 0) params.region = region
    return this.executeQuery('dashboard_abandoned_service_level', params, true, 60, username)
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

  /** Get list of phone numbers/DIDs for dropdowns — lookup_phonelist */
  async getLookupPhoneList(username?: string) {
    return this.executeQuery('lookup_phonelist', {}, true, 60, username)
  }

  // ── V6 Distribution by State ────────────────────────────────────────────

  /** Call distribution by state/area-code — distribution_distbystate */
  async getDistributionByState(startDate: string, endDate: string, region?: string[] | null, username?: string, queueIds?: string[], agentIds?: string[], dids?: string[]) {
    const params: any = {
      start_datetime: startDate,
      end_datetime: endDate,
      sla_threshold: '30',
      true_abandon_threshold: '30'
    }
    if (queueIds && queueIds.length > 0) params.queue_id = queueIds
    if (agentIds && agentIds.length > 0) params.agent_id = agentIds
    if (dids && dids.length > 0) params.did = dids
    if (region && region.length > 0) params.region = region
    return this.executeQuery('distribution_distbystate', params, true, 60, username)
  }

  // ── Contact Trace Queries ────────────────────────────────────────────────

  /** Answered call details — contact_traces_answered_call_details */
  async getAnsweredCallDetails(startDate: string, endDate: string, username?: string, queueIds?: string[], agentIds?: string[], dids?: string[], region?: string[] | null) {
    const params: any = { start_datetime: startDate, end_datetime: endDate }
    if (queueIds && queueIds.length > 0) params.queue_id = queueIds
    if (agentIds && agentIds.length > 0) params.agent_id = agentIds
    if (dids && dids.length > 0) params.did = dids
    if (region && region.length > 0) params.region = region
    return this.executeQuery('contact_traces_answered_call_details', params, true, 120, username)
  }

  /** Unanswered call details — contact_traces_unanswered_call_details */
  async getUnansweredCallDetails(startDate: string, endDate: string, username?: string, queueIds?: string[], agentIds?: string[], dids?: string[], region?: string[] | null) {
    const params: any = { start_datetime: startDate, end_datetime: endDate }
    if (queueIds && queueIds.length > 0) params.queue_id = queueIds
    if (agentIds && agentIds.length > 0) params.agent_id = agentIds
    if (dids && dids.length > 0) params.did = dids
    if (region && region.length > 0) params.region = region
    return this.executeQuery('contact_traces_unanswered_call_details', params, true, 120, username)
  }

  /** Call flow drilldown — contact_traces_call_details_drilldown */
  async getCallFlowDrilldown(contactId: string, username?: string) {
    return this.executeQuery('contact_traces_call_details_drilldown', {
      instance_id: 'fc8f1921-2aa3-4cf6-8fc4-ad4b42897030',
      contact_id: contactId,
    }, true, 60, username)
  }

  /** Agent totals summary — agent_agent_totals */
  async getAgentTotals(startDate: string, endDate: string, username?: string, agentIds?: string[], region?: string[] | null) {
    const params: any = { start_datetime: startDate, end_datetime: endDate }
    if (agentIds && agentIds.length > 0) params.agent_id = agentIds
    if (region && region.length > 0) params.region = region
    return this.executeQuery('agent_agent_totals', params, true, 60, username)
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
