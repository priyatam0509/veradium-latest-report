export const msalConfig = {
  auth: {
    clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || '3e8799c9-f60e-4bbd-8313-a91688c3d44d',
    authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID || 'c42f44e3-dca8-43ac-bfd0-9f2bbdce6c7a'}`,
    redirectUri: typeof window !== 'undefined' ? window.location.origin + '/auth/callback' : 'http://localhost:3000/auth/callback',
  },
  cache: {
    cacheLocation: 'localStorage' as const,
    storeAuthStateInCookie: false,
  },
}

export const loginRequest = {
  scopes: ['openid', 'profile', 'User.Read'],
}

export const graphConfig = {
  graphMeEndpoint: 'https://graph.microsoft.com/v1.0/me',
}
