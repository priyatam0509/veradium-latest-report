import { msalConfig, loginRequest, graphConfig } from './msal-config'

export interface MicrosoftUser {
  displayName: string
  mail: string
  userPrincipalName: string
}

class MicrosoftAuthService {
  private static instance: MicrosoftAuthService

  private constructor() {}

  static getInstance(): MicrosoftAuthService {
    if (!MicrosoftAuthService.instance) {
      MicrosoftAuthService.instance = new MicrosoftAuthService()
    }
    return MicrosoftAuthService.instance
  }

  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: msalConfig.auth.clientId,
      response_type: 'token',
      redirect_uri: msalConfig.auth.redirectUri,
      scope: loginRequest.scopes.join(' '),
    })

    return `${msalConfig.auth.authority}/oauth2/v2.0/authorize?${params.toString()}`
  }

  extractAccessToken(hash: string): string | null {
    const params = new URLSearchParams(hash.substring(1))
    return params.get('access_token')
  }

  async getUserInfo(accessToken: string): Promise<MicrosoftUser> {
    const response = await fetch(graphConfig.graphMeEndpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch user info from Microsoft Graph')
    }

    const data = await response.json()
    return {
      displayName: data.displayName,
      mail: data.mail || data.userPrincipalName,
      userPrincipalName: data.userPrincipalName,
    }
  }

  storeAccessToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('ms_access_token', token)
    }
  }

  getStoredAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ms_access_token')
    }
    return null
  }

  clearStoredToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ms_access_token')
    }
  }
}

export const microsoftAuthService = MicrosoftAuthService.getInstance()
