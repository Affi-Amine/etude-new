'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastProps {
  toast: Toast
  onRemove: (id: string) => void
}

const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info
}

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
}

function ToastComponent({ toast, onRemove }: ToastProps) {
  const Icon = toastIcons[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id)
    }, toast.duration || 5000)

    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onRemove])

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-300 ease-in-out',
        toastStyles[toast.type]
      )}
    >
      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{toast.title}</p>
        {toast.description && (
          <p className="text-sm opacity-90 mt-1">{toast.description}</p>
        )}
      </div>
      <button
        onClick={() => onRemove(toast.id)}
        className="flex-shrink-0 p-1 rounded-md hover:bg-black/10 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

let toastCounter = 0
let toastListeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

function addToast(toast: Omit<Toast, 'id'>) {
  const newToast = {
    ...toast,
    id: `toast-${++toastCounter}`
  }
  
  toasts = [...toasts, newToast]
  toastListeners.forEach(listener => listener(toasts))
  
  return newToast.id
}

function removeToast(id: string) {
  toasts = toasts.filter(toast => toast.id !== id)
  toastListeners.forEach(listener => listener(toasts))
}

export function useToast() {
  const [toastList, setToastList] = useState<Toast[]>(toasts)

  useEffect(() => {
    toastListeners.push(setToastList)
    return () => {
      toastListeners = toastListeners.filter(listener => listener !== setToastList)
    }
  }, [])

  return {
    toasts: toastList,
    toast: (toast: Omit<Toast, 'id'>) => addToast(toast),
    removeToast
  }
}

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  )
}

// Convenience functions
export const toast = {
  success: (title: string, description?: string) => addToast({ type: 'success', title, description }),
  error: (title: string, description?: string) => addToast({ type: 'error', title, description }),
  warning: (title: string, description?: string) => addToast({ type: 'warning', title, description }),
  info: (title: string, description?: string) => addToast({ type: 'info', title, description })
}