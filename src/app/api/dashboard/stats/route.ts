import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateStudentPaymentStatus } from '@/lib/payment-logic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get teacher data
    const teacher = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        groups: {
          include: {
            students: {
              include: {
                student: true
              }
            },
            sessions: {
              include: {
                attendance: true
              }
            }
          }
        },
        students: true,
        sessions: {
          include: {
            group: true,
            attendance: true
          }
        }
      }
    })

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 })
    }

    const { groups, sessions } = teacher

    // Get all students from groups (via groupStudent relationship)
    const allStudents = groups.flatMap((group: any) => 
      group.students.map((gs: any) => ({
        ...gs.student,
        groupId: group.id,
        group: group
      }))
    )

    // Calculate payment statuses for all students
    const studentsWithPaymentStatus = await Promise.all(
      allStudents.map(async (student: any) => {
        try {
          const paymentStatus = await calculateStudentPaymentStatus(
            student.id,
            student.groupId
          )
          return { ...student, paymentStatus }
        } catch (error) {
          console.error('Error calculating payment status for student:', student.id, error)
          return { ...student, paymentStatus: null }
        }
      })
    )

    // Get students needing payment
    const studentsNeedingPayment = studentsWithPaymentStatus.filter(
      (s: any) => s.paymentStatus && ['EN_ATTENTE', 'EN_RETARD'].includes(s.paymentStatus.currentStatus)
    )

    // Get sessions for current month
    const now = new Date()
    const currentMonth = now.getMonth() // 0-based: Jan=0, Feb=1, ..., Jul=6, ..., Dec=11
    const currentYear = now.getFullYear()
    console.log('API Current month:', currentMonth, '(0-based, so Jul=6)', 'Current year:', currentYear)
    console.log('Human readable month:', currentMonth + 1, '(1-based, so Jul=7)')
    const monthSessions = sessions.filter((session: any) => {
      const sessionDate = new Date(session.date)
      const sessionMonth = sessionDate.getMonth()
      const sessionYear = sessionDate.getFullYear()
      console.log(`Session ${session.id}: date=${session.date}, month=${sessionMonth} (0-based), year=${sessionYear}, matches=${sessionMonth === currentMonth && sessionYear === currentYear}`)
      return sessionMonth === currentMonth && sessionYear === currentYear
    })
    console.log('Filtered month sessions:', monthSessions.length)
    
    // Get upcoming sessions (next 7 days) for the upcoming sessions list
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const upcomingSessions = sessions.filter((session: any) => {
      const sessionDate = new Date(session.date)
      return sessionDate >= now && sessionDate <= nextWeek
    })

    // Get recent sessions (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const recentSessions = sessions.filter((session: any) => {
      const sessionDate = new Date(session.date)
      return sessionDate >= thirtyDaysAgo && sessionDate <= now
    })

    // Calculate total earnings this month
    console.log('=== DEBUGGING MONTHLY EARNINGS ===')
    console.log('Current month:', currentMonth, '(0-based, so Jul=6)', 'Current year:', currentYear)
    console.log('Human readable current month:', currentMonth + 1, '(1-based, so Jul=7)')
    console.log('Total sessions:', sessions.length)
    console.log('Month sessions count:', monthSessions.length)
    console.log('Month sessions:', monthSessions.map(s => ({ id: s.id, date: s.date, groupId: s.groupId, attendanceCount: s.attendance?.length })))
    
    const totalEarningsThisMonth = monthSessions.reduce((total: number, session: any) => {
      const group = groups.find((g: any) => g.id === session.groupId)
      if (!group) {
        console.log('No group found for session:', session.id, 'groupId:', session.groupId)
        return total
      }
      const attendeeCount = session.attendance?.filter((a: any) => a.status === 'PRESENT').length || 0
      const pricePerStudent = group.sessionFee || (group.monthlyFee ? group.monthlyFee / 4 : 0)
      const sessionEarning = attendeeCount * (pricePerStudent || 0)
      console.log(`Session ${session.id}: ${attendeeCount} present × ${pricePerStudent} DT = ${sessionEarning} DT`)
      return total + sessionEarning
    }, 0)
    
    console.log('Total earnings this month:', totalEarningsThisMonth)
    console.log('=== END DEBUGGING ===')

    // Calculate average attendance rate
    const averageAttendanceRate = groups.length > 0 ? groups.reduce((total: number, group: any) => {
      const groupSessions = sessions.filter((s: any) => s.groupId === group.id && s.status === 'COMPLETED')
      if (groupSessions.length === 0) return total
      
      const groupAttendanceRate = groupSessions.reduce((sessionTotal: number, session: any) => {
        const attendanceCount = session.attendance?.filter((a: any) => a.status === 'PRESENT').length || 0
        const totalStudents = session.attendance?.length || 0
        if (totalStudents === 0) return sessionTotal
        return sessionTotal + (attendanceCount / totalStudents) * 100
      }, 0) / groupSessions.length
      
      return total + (isNaN(groupAttendanceRate) ? 0 : groupAttendanceRate)
    }, 0) / groups.length : 0

    const dashboardStats = {
      totalStudents: allStudents.length,
      totalGroups: groups.length,
      totalEarningsThisMonth,
      studentsNeedingPayment: studentsNeedingPayment.length,
      upcomingSessions: upcomingSessions.length,
      averageAttendanceRate: Math.round(averageAttendanceRate),
      studentsWithPaymentStatus,
      upcomingSessionsList: upcomingSessions.slice(0, 10),
      recentSessions: recentSessions.slice(0, 10),
      students: allStudents,
      groups,
      sessions,
    }

    return NextResponse.json(dashboardStats)
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}