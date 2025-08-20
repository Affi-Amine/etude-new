'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AlertDialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface AlertDialogContentProps {
  className?: string
  children: React.ReactNode
}

interface AlertDialogHeaderProps {
  className?: string
  children: React.ReactNode
}

interface AlertDialogTitleProps {
  className?: string
  children: React.ReactNode
}

interface AlertDialogDescriptionProps {
  className?: string
  children: React.ReactNode
}

interface AlertDialogFooterProps {
  className?: string
  children: React.ReactNode
}

interface AlertDialogActionProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
}

interface AlertDialogCancelProps {
  className?: string
  children: React.ReactNode
  onClick?: () => void
}

const AlertDialog = ({ open, onOpenChange, children }: AlertDialogProps) => {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  )
}

const AlertDialogContent = React.forwardRef<
  HTMLDivElement,
  AlertDialogContentProps
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "bg-white rounded-lg shadow-lg max-w-md w-full mx-4 p-6",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
AlertDialogContent.displayName = "AlertDialogContent"

const AlertDialogHeader = ({
  className,
  ...props
}: AlertDialogHeaderProps) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left mb-4",
      className
    )}
    {...props}
  />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogTitle = React.forwardRef<
  HTMLParagraphElement,
  AlertDialogTitleProps
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
AlertDialogTitle.displayName = "AlertDialogTitle"

const AlertDialogDescription = React.forwardRef<
  HTMLParagraphElement,
  AlertDialogDescriptionProps
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-600", className)}
    {...props}
  />
))
AlertDialogDescription.displayName = "AlertDialogDescription"

const AlertDialogFooter = ({
  className,
  ...props
}: AlertDialogFooterProps) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-6",
      className
    )}
    {...props}
  />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogAction = React.forwardRef<
  HTMLButtonElement,
  AlertDialogActionProps
>(({ className, children, onClick, disabled, ...props }, ref) => (
  <Button
    ref={ref}
    className={className}
    onClick={onClick}
    disabled={disabled}
    {...props}
  >
    {children}
  </Button>
))
AlertDialogAction.displayName = "AlertDialogAction"

const AlertDialogCancel = React.forwardRef<
  HTMLButtonElement,
  AlertDialogCancelProps
>(({ className, children, onClick, ...props }, ref) => (
  <Button
    ref={ref}
    variant="outline"
    className={cn("mt-2 sm:mt-0", className)}
    onClick={onClick}
    {...props}
  >
    {children}
  </Button>
))
AlertDialogCancel.displayName = "AlertDialogCancel"

export {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
}