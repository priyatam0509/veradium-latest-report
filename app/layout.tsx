import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { GlobalFiltersProvider } from "@/lib/global-filters-context"
import { Toaster } from "@/components/ui/toaster"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "The Ticket Clinic Dashboard",
  description: "veradium: secure and private identity management",
  generator: "veradium",
  icons: {
    icon: [

     
    ],
    apple: "/apple-icon.png",
  },
}
{}
export default function RootLayout({
  children,


}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <AuthProvider>
          <GlobalFiltersProvider>
            {children}
            <Toaster />
          </GlobalFiltersProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
