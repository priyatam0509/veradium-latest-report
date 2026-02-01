"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"

export default function LoginPage() {
  const { user, login } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) {
      router.push("/dashboard/overview")
    }
  }, [user, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 px-4 py-12">
      <Card className="w-full max-w-md">
        {/* ============================ Header ============================ */}
        <CardHeader className="space-y-2 flex flex-col items-center text-center">
          <div className="mb-2">
            <Image
              src="/veradium-image.jpg"
              alt="Veradium Logo"
              width={64}
              height={40}
              priority
            />
          </div>

          <CardTitle className="text-2xl font-semibold tracking-tight">
            Veradium Dashboard
          </CardTitle>

          <CardDescription className="text-sm">
            Secure access to analytics, reporting, and performance insights
          </CardDescription>
        </CardHeader>

        {/* ============================ Content ============================ */}
        <CardContent className="space-y-6">
          <Button
            onClick={login}
            className="w-full h-12 text-base font-medium"
            variant="outline"
          >
            <svg
              className="w-5 h-5 mr-3"
              viewBox="0 0 21 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="1" y="1" width="9" height="9" fill="#F25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
              <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
              <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
            </svg>
            Sign in with Microsoft
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Microsoft Entra ID Authentication
              </span>
            </div>
          </div>

          <div className="text-xs text-center text-muted-foreground space-y-1">
            <p>Your access is validated using Veradium RBAC services</p>
            <p>to ensure correct roles and permissions</p>
          </div>
        </CardContent>

        {/* ============================ Footer ============================ */}
        <CardFooter className="flex flex-col space-y-2">
          <p className="text-xs text-center text-muted-foreground">
            © {new Date().getFullYear()} Veradium. All rights reserved.
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
