import './globals.css'
import React from 'react'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'ITWale Notes Shop',
  description: 'SPPU Engineering Notes and PYQs',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-6xl mx-auto px-4">
          <header className="sticky top-0 z-40 bg-gray-50/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 border-b">
            <div className="flex items-center justify-between py-4">
              <a href="/" className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">IN</span>
                <span className="text-xl font-bold">ITWale Notes</span>
              </a>
              <NavBar />
            </div>
          </header>
          <main className="py-6">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  )
}
