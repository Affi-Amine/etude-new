import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Group, Student, Session } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  if (!date) {
    return 'Date invalide'
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Date invalide'
  }
  
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(dateObj)
}

export function formatDateLong(date: Date | string): string {
  if (!date) {
    return 'Date invalide'
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return 'Date invalide'
  }
  
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(dateObj)
}

export function formatTime(time: Date | string | undefined): string {
  if (!time) return '--:--'
  
  if (typeof time === 'string') {
    // Handle time strings like "14:30"
    return time
  }
  
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(time)
}

export function formatDateTime(date: Date | string): string {
  return `${formatDate(date)} à ${formatTime(date)}`
}

export function formatDateForInput(date: Date | string): string {
  if (!date) {
    return ''
  }
  
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  if (isNaN(dateObj.getTime())) {
    return ''
  }
  
  return dateObj.toISOString().split('T')[0]
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Date utilities
export function isToday(date: Date): boolean {
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

export function isThisWeek(date: Date): boolean {
  const today = new Date()
  const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()))
  const endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6))
  return date >= startOfWeek && date <= endOfWeek
}

// Weekly schedule utilities
export function formatWeeklySchedule(weeklySchedule: any): string {
  if (!weeklySchedule || weeklySchedule.length === 0) {
    return 'N/A à N/A'
  }

  const dayMap = {
    MONDAY: 'Lundi',
    TUESDAY: 'Mardi', 
    WEDNESDAY: 'Mercredi',
    THURSDAY: 'Jeudi',
    FRIDAY: 'Vendredi',
    SATURDAY: 'Samedi',
    SUNDAY: 'Dimanche'
  }

  // Parse weeklySchedule if it's a string
  let schedule = weeklySchedule
  if (typeof weeklySchedule === 'string') {
    try {
      schedule = JSON.parse(weeklySchedule)
    } catch {
      return 'N/A à N/A'
    }
  }

  if (!Array.isArray(schedule) || schedule.length === 0) {
    return 'N/A à N/A'
  }

  // Format each session
  const sessions = schedule.map((session: any) => {
    const day = dayMap[session.dayOfWeek as keyof typeof dayMap] || session.dayOfWeek
    const time = session.startTime || 'N/A'
    return `${day} à ${time}`
  })

  return sessions.join(', ')
}

export function getFirstScheduleTime(weeklySchedule: any): string {
  if (!weeklySchedule || weeklySchedule.length === 0) {
    return 'N/A'
  }

  // Parse weeklySchedule if it's a string
  let schedule = weeklySchedule
  if (typeof weeklySchedule === 'string') {
    try {
      schedule = JSON.parse(weeklySchedule)
    } catch {
      return 'N/A'
    }
  }

  if (!Array.isArray(schedule) || schedule.length === 0) {
    return 'N/A'
  }

  return schedule[0]?.startTime || 'N/A'
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function getDayName(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', { weekday: 'long' }).format(date)
}

// Payment utilities
export function getPaymentStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    'paid': 'Payé',
    'pending': 'En attente',
    'overdue': 'En retard',
    'overflow': 'Dépassement',
    'due': 'Dû',
    'approaching': 'Approche',
    'A_JOUR': 'À jour',
    'EN_ATTENTE': 'En attente',
    'EN_RETARD': 'En retard',
    'PAID': 'Payé',
    'PENDING': 'En attente',
    'OVERDUE': 'En retard',
    'UP_TO_DATE': 'À jour'
  }
  return statusTexts[status] || 'Inconnu'
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'paid': 'text-green-600 bg-green-50',
    'pending': 'text-yellow-600 bg-yellow-50',
    'overdue': 'text-red-600 bg-red-50',
    'overflow': 'text-purple-600 bg-purple-50',
    'due': 'text-red-600 bg-red-50',
    'approaching': 'text-yellow-600 bg-yellow-50',
    'A_JOUR': 'text-green-600 bg-green-50',
    'EN_ATTENTE': 'text-yellow-600 bg-yellow-50',
    'EN_RETARD': 'text-red-600 bg-red-50',
    'PAID': 'text-green-600 bg-green-50',
    'PENDING': 'text-yellow-600 bg-yellow-50',
    'OVERDUE': 'text-red-600 bg-red-50',
    'UP_TO_DATE': 'text-green-600 bg-green-50'
  }
  return colors[status] || 'text-gray-600 bg-gray-50'
}

// Session utilities
export function calculateAttendanceRate(sessions: Session[], studentId: string): number {
  const studentSessions = sessions.filter(session => 
    session.attendees?.some(attendee => attendee.studentId === studentId)
  )
  
  if (studentSessions.length === 0) return 0
  
  const attendedSessions = studentSessions.filter(session =>
    session.attendees?.find(attendee => 
      attendee.studentId === studentId && attendee.present
    )
  )
  
  return Math.round((attendedSessions.length / studentSessions.length) * 100)
}

export function getGroupAttendanceRate(sessions: Session[], groupId: string): number {
  const groupSessions = sessions.filter(s => s.groupId === groupId && s.status === 'COMPLETED')
  
  if (groupSessions.length === 0) return 0
  
  // Use attendance instead of attendees for compatibility with API data
  const totalPossibleAttendances = groupSessions.reduce((total, session) => 
    total + (session.attendance?.length || session.attendees?.length || 0), 0
  )
  
  const totalActualAttendances = groupSessions.reduce((total, session) => {
    if (session.attendance) {
      return total + (session.attendance.filter((a: any) => a.status === 'PRESENT').length || 0)
    } else if (session.attendees) {
      return total + (session.attendees.filter(a => a.present).length || 0)
    }
    return total
  }, 0)
  
  if (totalPossibleAttendances === 0) return 0
  
  return Math.round((totalActualAttendances / totalPossibleAttendances) * 100)
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

export function validateGroupName(name: string): boolean {
  return name.trim().length >= 3 && name.trim().length <= 50
}

export function validatePrice(price: number): boolean {
  return price > 0 && price <= 1000
}

export function validateSessionsPerCycle(sessions: number): boolean {
  return [4, 6, 8].includes(sessions)
}

// Search and filter utilities
export function searchStudents(students: Student[], query: string): Student[] {
  if (!query.trim()) return students
  
  const lowercaseQuery = query.toLowerCase()
  return students.filter(student => 
    student.name.toLowerCase().includes(lowercaseQuery) ||
    (student.email && student.email.toLowerCase().includes(lowercaseQuery)) ||
    (student.phone && student.phone.includes(query))
  )
}

export function searchGroups(groups: Group[], query: string): Group[] {
  if (!query.trim()) return groups
  
  const lowercaseQuery = query.toLowerCase()
  return groups.filter(group => 
    group.name.toLowerCase().includes(lowercaseQuery) ||
    group.subject.toLowerCase().includes(lowercaseQuery)
  )
}

export function filterSessionsByDateRange(sessions: Session[], startDate: Date, endDate: Date): Session[] {
  return sessions.filter(session => {
    const sessionDate = new Date(session.date)
    return sessionDate >= startDate && sessionDate <= endDate
  })
}

// Sorting utilities
export function sortStudentsByName(students: Student[]): Student[] {
  return [...students].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

export function sortGroupsByName(groups: Group[]): Group[] {
  return [...groups].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

export function sortSessionsByDate(sessions: Session[], ascending: boolean = true): Session[] {
  return [...sessions].sort((a, b) => {
    const dateA = new Date(a.date).getTime()
    const dateB = new Date(b.date).getTime()
    return ascending ? dateA - dateB : dateB - dateA
  })
}

// Export utilities
export function generateCSVContent(data: any[], headers: string[]): string {
  const csvHeaders = headers.join(',')
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header]
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`
      }
      return value || ''
    }).join(',')
  )
  
  return [csvHeaders, ...csvRows].join('\n')
}

export function downloadCSV(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// Notification utilities
export function generatePaymentNotification(studentName: string, amount: number, groupName: string): string {
  return `${studentName} doit payer ${formatCurrency(amount)} pour le groupe "${groupName}".`
}

export function generateOverflowNotification(studentName: string, excessSessions: number, groupName: string): string {
  return `${studentName} a ${excessSessions} séance(s) en dépassement dans le groupe "${groupName}".`
}

// Local storage utilities
export function saveToLocalStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('Error saving to localStorage:', error)
  }
}

export function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : defaultValue
  } catch (error) {
    console.error('Error loading from localStorage:', error)
    return defaultValue
  }
}

export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key)
  } catch (error) {
    console.error('Error removing from localStorage:', error)
  }
}