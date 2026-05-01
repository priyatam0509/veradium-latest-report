"use client"

import type React from "react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/dnijbboek/image/upload/v1777654360/the_ticket_clinic_rzbfy6.png"
              alt="The Ticket Clinic Logo"
              width={120}
              height={120}
              style={{ objectFit: "contain" }}
            />
          </div>

          <CardTitle className="text-2xl font-semibold tracking-tight">
            The Ticket Clinic Dashboard
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
        </CardContent>

        {/* ============================ Footer ============================ */}
        <CardFooter className="flex flex-col space-y-2">
        </CardFooter>
      </Card>
    </div>
  )
}
