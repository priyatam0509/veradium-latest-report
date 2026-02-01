'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { microsoftAuthService } from '@/lib/microsoft-auth-service'
import { completeAuthLogin } from '@/hooks/use-auth'

export default function CallbackPage() {
  const router = useRouter()
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing')
  const [errorMessage, setErrorMessage] = useState<string>('')

  useEffect(() => {
    const processCallback = async () => {
      try {
        const hash = window.location.hash
        
        if (!hash.includes('access_token')) {
          setStatus('error')
          setErrorMessage('No access token found in callback')
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        // Extract access token from URL
        const accessToken = microsoftAuthService.extractAccessToken(hash)
        
        if (!accessToken) {
          setStatus('error')
          setErrorMessage('Failed to extract access token')
          setTimeout(() => router.push('/login'), 2000)
          return
        }

        // Get user info from Microsoft Graph
        const msUser = await microsoftAuthService.getUserInfo(accessToken)
        
        // Complete login by verifying with AWS RBAC API
        await completeAuthLogin(accessToken, {
          email: msUser.userPrincipalName,
          displayName: msUser.displayName,
        })

        setStatus('success')
        
        // Clear hash and redirect to dashboard
        window.history.replaceState({}, document.title, window.location.pathname)
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
        
      } catch (error) {
        console.error('Callback processing error:', error)
        setStatus('error')
        setErrorMessage(
          error instanceof Error ? error.message : 'Authentication failed. Please try again.'
        )
        setTimeout(() => router.push('/login'), 3000)
      }
    }

    processCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-md p-8">
        <div className="rounded-lg bg-white p-8 shadow-lg dark:bg-slate-800">
          {status === 'processing' && (
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <h2 className="mb-2 text-xl font-semibold">Processing Authentication...</h2>
              <p className="text-sm text-muted-foreground">
                Please wait while we complete your login.
              </p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg
                  className="h-6 w-6 text-green-600 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-green-600 dark:text-green-400">
                Authentication Successful!
              </h2>
              <p className="text-sm text-muted-foreground">Redirecting to dashboard...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
                <svg
                  className="h-6 w-6 text-red-600 dark:text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-red-600 dark:text-red-400">
                Authentication Failed
              </h2>
              <p className="text-sm text-muted-foreground">{errorMessage}</p>
              <p className="mt-2 text-xs text-muted-foreground">Redirecting to login...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
