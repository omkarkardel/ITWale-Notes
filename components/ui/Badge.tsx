import React from 'react'

type Props = { children: React.ReactNode; tone?: 'blue' | 'gray' | 'green' | 'red' | 'amber'; className?: string }

export default function Badge({ children, tone = 'blue', className = '' }: Props) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700 ring-blue-200',
    gray: 'bg-gray-100 text-gray-700 ring-gray-300',
    green: 'bg-green-50 text-green-700 ring-green-200',
    red: 'bg-red-50 text-red-700 ring-red-200',
    amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  }
  return <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ring-1 ${tones[tone]} ${className}`}>{children}</span>
}
