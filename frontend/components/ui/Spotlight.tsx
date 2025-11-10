"use client"
import React from 'react'

export default function Spotlight({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none fixed inset-0 -z-10 overflow-hidden ${className}`} aria-hidden>
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500/25 via-sky-400/20 to-indigo-500/20 blur-3xl animate-pulse-slow" />
      <div className="absolute top-1/3 -right-40 h-[28rem] w-[28rem] rounded-full bg-gradient-to-br from-fuchsia-500/20 via-purple-500/20 to-indigo-500/20 blur-3xl animate-pulse-slower" />
      <div className="absolute -bottom-40 left-1/4 h-[26rem] w-[26rem] rounded-full bg-gradient-to-br from-emerald-500/20 via-teal-400/20 to-cyan-500/20 blur-3xl animate-pulse-slow" />
    </div>
  )
}
