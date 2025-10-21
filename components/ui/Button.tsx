import React from 'react'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }

export default function Button({ variant='primary', className='', ...props }: Props) {
  const base = 'px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:translate-y-[1px]'
  const styles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-blue-600/25 focus:ring-blue-400',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 shadow-sm focus:ring-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm focus:ring-red-400',
    ghost: 'bg-transparent text-blue-700 hover:bg-blue-100 focus:ring-blue-200',
  }[variant]
  return <button className={`${base} ${styles} ${className}`} {...props} />
}
