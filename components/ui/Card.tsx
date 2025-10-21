import React from 'react'

export default function Card({ children, className='' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-4 border rounded-xl bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {children}
    </div>
  )
}
