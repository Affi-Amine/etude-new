'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Calendar,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Home,
  UserCheck,
  DollarSign
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/store/auth'
import { useSession } from 'next-auth/react'
import { getInitials } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const { teacher, setTeacher, logout } = useAuthStore()
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  const navigation = [
    { name: 'Tableau de bord', href: '/dashboard', icon: Home, current: pathname === '/dashboard' },
    { name: 'Calendrier', href: '/dashboard/calendrier', icon: Calendar, current: pathname === '/dashboard/calendrier' },
    { name: 'Groupes', href: '/dashboard/groupes', icon: Users, current: pathname === '/dashboard/groupes' },
    { name: 'Étudiants', href: '/dashboard/etudiants', icon: User, current: pathname === '/dashboard/etudiants' },
    { name: 'Cours', href: '/dashboard/cours', icon: BookOpen, current: pathname === '/dashboard/cours' },
    { name: 'Présence', href: '/dashboard/presence', icon: UserCheck, current: pathname === '/dashboard/presence' },
    { name: 'Paiements', href: '/dashboard/paiements', icon: DollarSign, current: pathname === '/dashboard/paiements' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3, current: pathname === '/dashboard/analytics' },
    { name: 'Notifications', href: '/dashboard/notifications', icon: Bell, current: pathname === '/dashboard/notifications' },
  ]

  const handleLogout = () => {
    logout()
    router.push('/auth/connexion')
  }

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Update teacher state from session
  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      setTeacher({
        id: session.user.id,
        name: session.user.name || '',
        firstName: session.user.firstName || '',
        lastName: session.user.lastName || '',
        email: session.user.email || '',
        avatar: session.user.image || undefined,
        status: session.user.status as 'pending' | 'approved' | 'rejected',
        subjects: [], // Assuming subjects are not in session, or fetch separately
        experience: 0, // Assuming experience is not in session, or fetch separately
        createdAt: new Date(), // Assuming createdAt is not in session, or fetch separately
      })
    } else if (status === 'unauthenticated') {
      setTeacher(null)
      router.push('/auth/connexion')
    }
  }, [session, status, setTeacher, router])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setProfileDropdownOpen(false)
    }
    
    if (profileDropdownOpen) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [profileDropdownOpen])

  if (status === 'loading' || !teacher) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl lg:hidden"
          >
            <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">LP</span>
                </div>
                <span className="text-xl font-bold text-gray-900">LessonPro</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <nav className="mt-6 px-3">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                          item.current
                            ? 'bg-indigo-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <Icon className="mr-3 h-5 w-5" />
                        {item.name}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">LP</span>
              </div>
              <span className="text-xl font-bold text-gray-900">LessonPro</span>
            </div>
          </div>
          <nav className="mt-6 flex-1 px-3">
            <ul className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                        item.current
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>
          
          {/* User profile section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {teacher.firstName[0]}{teacher.lastName[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {teacher.firstName} {teacher.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {teacher.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-30 bg-white border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {/* Search */}
              <div className="hidden sm:block">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Rechercher..."
                    className="pl-10 w-64 bg-gray-50 border-0 focus:bg-white"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>
              
              {/* Profile dropdown */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setProfileDropdownOpen(!profileDropdownOpen)
                  }}
                >
                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-xs">
                      {teacher.firstName[0]}{teacher.lastName[0]}
                    </span>
                  </div>
                  <span className="hidden sm:block text-sm font-medium text-gray-700">
                    {teacher.firstName}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </Button>
                
                <AnimatePresence>
                  {profileDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href="/dashboard/profil"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <User className="mr-3 h-4 w-4" />
                        Mon profil
                      </Link>
                      <Link
                        href="/dashboard/parametres"
                        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Settings className="mr-3 h-4 w-4" />
                        Paramètres
                      </Link>
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        Se déconnecter
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
        
        {/* Page content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  )
}