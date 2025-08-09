import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Espace Parent - Étude Platform',
  description: 'Suivez les progrès de votre enfant',
}

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  )
}