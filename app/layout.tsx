import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: 'FlowZone - Real-time Crowd Intelligence for Sporting Venues',
  description: 'Navigate large sporting venues like a VIP. Real-time wait times for food, drinks, restrooms, and exits. Smart recommendations to minimize time away from the action.',
  keywords: ['crowd management', 'sporting events', 'wait times', 'venue navigation', 'real-time updates', 'stadium app'],
  authors: [{ name: 'FlowZone' }],
  creator: 'FlowZone',
  publisher: 'FlowZone',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'FlowZone - Real-time Crowd Intelligence',
    description: 'Navigate sporting venues like a VIP. Real-time wait times and smart recommendations.',
    type: 'website',
    locale: 'en_US',
    siteName: 'FlowZone',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlowZone - Real-time Crowd Intelligence',
    description: 'Navigate sporting venues like a VIP. Real-time wait times and smart recommendations.',
  },
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} bg-background`}>
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="font-sans antialiased min-h-screen">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
