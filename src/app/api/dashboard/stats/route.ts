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
      (s: any) => s.paymentStatus && ['pending', 'overdue', 'overflow'].includes(s.paymentStatus.status)
    )

    // Get sessions for current month
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    const monthSessions = sessions.filter((session: any) => {
      const sessionDate = new Date(session.date)
      return sessionDate.getMonth() === currentMonth && sessionDate.getFullYear() === currentYear
    })
    
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
    const totalEarningsThisMonth = recentSessions.reduce((total: number, session: any) => {
      const group = groups.find((g: any) => g.id === session.groupId)
      if (!group) return total
      const attendeeCount = session.attendance?.filter((a: any) => a.present).length || 0
      const pricePerStudent = group.sessionFee || (group.monthlyFee ? group.monthlyFee / 4 : 0)
      return total + (attendeeCount * (pricePerStudent || 0))
    }, 0)

    // Calculate average attendance rate
    const averageAttendanceRate = groups.length > 0 ? groups.reduce((total: number, group: any) => {
      const groupSessions = sessions.filter((s: any) => s.groupId === group.id)
      if (groupSessions.length === 0) return total
      
      const groupAttendanceRate = groupSessions.reduce((sessionTotal: number, session: any) => {
        const attendanceCount = session.attendance?.filter((a: any) => a.present).length || 0
        const totalStudents = session.attendance?.length || 1
        return sessionTotal + (attendanceCount / totalStudents) * 100
      }, 0) / groupSessions.length
      
      return total + groupAttendanceRate
    }, 0) / groups.length : 0

    const dashboardStats = {
      totalStudents: allStudents.length,
      totalGroups: groups.length,
      totalEarningsThisMonth,
      studentsNeedingPayment: studentsNeedingPayment.length,
      upcomingSessions: monthSessions.length,
      averageAttendanceRate: Math.round(averageAttendanceRate),
      studentsWithPaymentStatus,
      upcomingSessionsList: upcomingSessions.slice(0, 10),
      recentSessions: recentSessions.slice(0, 5),
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