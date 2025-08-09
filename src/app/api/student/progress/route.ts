import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  studentId: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
})

// GET /api/student/progress - Get student progress and attendance data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { studentId, groupId } = querySchema.parse({
      studentId: searchParams.get('studentId'),
      groupId: searchParams.get('groupId'),
    })

    // For student users, get their student profile
    let targetStudentId = studentId
    if (session.user.role === 'STUDENT') {
      const studentProfile = await prisma.student.findFirst({
        where: { userId: session.user.id }
      })
      
      if (!studentProfile) {
        return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
      }
      
      targetStudentId = studentProfile.id
    }

    if (!targetStudentId) {
      return NextResponse.json({ error: 'Student ID is required' }, { status: 400 })
    }

    // Get student with groups and attendance
    const student = await prisma.student.findUnique({
      where: { id: targetStudentId },
      include: {
        groups: {
          where: {
            isActive: true,
            ...(groupId && { groupId })
          },
          include: {
            group: {
              select: {
                id: true,
                name: true,
                subject: true,
                scheduleDay: true,
                scheduleTime: true,
                monthlyFee: true
              }
            }
          }
        },
        attendance: {
          include: {
            session: {
              include: {
                group: {
                  select: {
                    id: true,
                    name: true,
                    subject: true
                  }
                }
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Calculate progress statistics
    const groupIds = student.groups.map(sg => sg.groupId)
    
    // Get all sessions for student's groups
    const allSessions = await prisma.session.findMany({
      where: {
        groupId: { in: groupIds },
        status: 'COMPLETED'
      }
    })

    // Calculate attendance statistics by group
    const groupProgress = student.groups.map(groupStudent => {
      const group = groupStudent.group
      const groupSessions = allSessions.filter(s => s.groupId === group.id)
      const groupAttendance = student.attendance.filter(a => a.session.group.id === group.id)
      
      const totalSessions = groupSessions.length
      const attendedSessions = groupAttendance.filter(a => a.status === 'PRESENT').length
      const lateSessions = groupAttendance.filter(a => a.status === 'LATE').length
      const absentSessions = groupAttendance.filter(a => a.status === 'ABSENT').length
      
      const attendanceRate = totalSessions > 0 ? Math.round((attendedSessions / totalSessions) * 100) : 0
      
      // Get recent sessions (last 5)
      const recentAttendance = groupAttendance
        .slice(0, 5)
        .map(a => ({
          sessionId: a.session.id,
          date: a.session.date,
          status: a.status,
          notes: a.notes
        }))

      return {
        group,
        stats: {
          totalSessions,
          attendedSessions,
          lateSessions,
          absentSessions,
          attendanceRate
        },
        recentAttendance
      }
    })

    // Overall statistics
    const totalSessions = allSessions.length
    const totalAttended = student.attendance.filter(a => a.status === 'PRESENT').length
    const totalLate = student.attendance.filter(a => a.status === 'LATE').length
    const totalAbsent = student.attendance.filter(a => a.status === 'ABSENT').length
    const overallAttendanceRate = totalSessions > 0 ? Math.round((totalAttended / totalSessions) * 100) : 0

    // Get upcoming sessions
    const upcomingSessions = await prisma.session.findMany({
      where: {
        groupId: { in: groupIds },
        status: 'SCHEDULED',
        date: { gte: new Date() }
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        }
      },
      orderBy: { date: 'asc' },
      take: 5
    })

    return NextResponse.json({
      student: {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        classe: student.classe,
        lycee: student.lycee,
        level: student.level,
        enrollmentDate: student.enrollmentDate
      },
      overallStats: {
        totalSessions,
        attendedSessions: totalAttended,
        lateSessions: totalLate,
        absentSessions: totalAbsent,
        attendanceRate: overallAttendanceRate
      },
      groupProgress,
      upcomingSessions: upcomingSessions.map(session => ({
        id: session.id,
        date: session.date,
        duration: session.duration,
        title: session.title,
        group: session.group
      })),
      recentPayments: student.payments.map(payment => ({
        id: payment.id,
        amount: payment.amount,
        type: payment.type,
        status: payment.status,
        dueDate: payment.dueDate,
        paidDate: payment.paidDate,
        createdAt: payment.createdAt
      }))
    })

  } catch (error) {
    console.error('Error fetching student progress:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}