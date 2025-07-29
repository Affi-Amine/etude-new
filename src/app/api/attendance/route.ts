import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getTenantPrisma, getCurrentTenantId } from '@/lib/db-tenant'
import { z } from 'zod'
import { updateAllPaymentStatuses } from '@/lib/payment-logic'

const createAttendanceSchema = z.object({
  sessionId: z.string().min(1),
  attendanceData: z.array(z.object({
    studentId: z.string().min(1),
    status: z.enum(['PRESENT', 'ABSENT']),
    notes: z.string().optional()
  }))
})

const bulkAttendanceSchema = z.object({
  groupId: z.string().min(1),
  date: z.string().datetime(),
  duration: z.number().min(1).optional(),
  attendanceData: z.array(z.object({
    studentId: z.string().min(1),
    status: z.enum(['PRESENT', 'ABSENT']),
    notes: z.string().optional()
  }))
})

// GET /api/attendance - Get attendance records
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const groupId = searchParams.get('groupId')
    const studentId = searchParams.get('studentId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const prisma = await getTenantPrisma()

    const whereClause: any = {
      session: {
        teacherId: session.user.id
      }
    }

    if (sessionId) whereClause.sessionId = sessionId
    if (studentId) whereClause.studentId = studentId
    if (groupId) whereClause.session = { ...whereClause.session, groupId }
    if (startDate || endDate) {
      whereClause.session.date = {}
      if (startDate) whereClause.session.date.gte = new Date(startDate)
      if (endDate) whereClause.session.date.lte = new Date(endDate)
    }

    const attendance = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        session: {
          select: {
            id: true,
            date: true,
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(attendance)
  } catch (error) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 })
  }
}

// POST /api/attendance - Create attendance records
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const prisma = await getTenantPrisma()

    // Check if this is a bulk attendance creation (with session creation)
    if (body.groupId && body.date) {
      const validatedData = bulkAttendanceSchema.parse(body)
      
      // Verify the group belongs to the current teacher
      const group = await prisma.group.findFirst({
        where: {
          id: validatedData.groupId,
          teacherId: session.user.id
        },
        include: {
          students: {
            include: {
              student: true
            }
          }
        }
      })

      if (!group) {
        return NextResponse.json(
          { error: 'Group not found or access denied' },
          { status: 404 }
        )
      }

      const sessionDate = new Date(validatedData.date)
      
      // Check if a session already exists for this group on this date
      let existingSession = await prisma.session.findFirst({
        where: {
          groupId: validatedData.groupId,
          teacherId: session.user.id,
          date: {
            gte: new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate()),
            lt: new Date(sessionDate.getFullYear(), sessionDate.getMonth(), sessionDate.getDate() + 1)
          }
        }
      })

      let targetSession
      
      if (existingSession) {
        // Use existing session and update its status if needed
        targetSession = await prisma.session.update({
          where: { id: existingSession.id },
          data: {
            status: 'COMPLETED',
            duration: validatedData.duration || existingSession.duration
          }
        })
        
        // Delete existing attendance for this session to replace with new data
        await prisma.attendance.deleteMany({
          where: {
            sessionId: existingSession.id
          }
        })
      } else {
        // Create a new session only if none exists
        targetSession = await prisma.session.create({
          data: {
            groupId: validatedData.groupId,
            teacherId: session.user.id,
            date: sessionDate,
            duration: validatedData.duration || group.scheduleDuration || (Array.isArray(group.weeklySchedule) && group.weeklySchedule[0] && typeof group.weeklySchedule[0] === 'object' && 'duration' in group.weeklySchedule[0] ? (group.weeklySchedule[0] as any).duration : null) || 60,
            status: 'COMPLETED'
          }
        })
      }

      // Create attendance records
      const attendanceRecords = await prisma.attendance.createMany({
        data: validatedData.attendanceData.map(attendance => ({
          sessionId: targetSession.id,
          studentId: attendance.studentId,
          status: attendance.status,
          notes: attendance.notes,
          teacherId: session.user.id
        }))
      })

      // Fetch the session with attendance
      const sessionWithAttendance = await prisma.session.findUnique({
        where: { id: targetSession.id },
        include: {
          group: {
            select: {
              id: true,
              name: true,
              subject: true
            }
          },
          attendance: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        }
      })

      // Update payment statuses for the group
      try {
        await updateAllPaymentStatuses(validatedData.groupId);
      } catch (error) {
        console.error('Failed to update payment statuses:', error);
        // Don't fail the request if payment update fails
      }

      return NextResponse.json({
        success: true,
        session: sessionWithAttendance,
        attendanceCount: attendanceRecords.count,
        isUpdate: !!existingSession
      }, { status: existingSession ? 200 : 201 })
    } else {
      // Handle existing session attendance
      const validatedData = createAttendanceSchema.parse(body)
      
      // Verify the session belongs to the current teacher
      const sessionRecord = await prisma.session.findFirst({
        where: {
          id: validatedData.sessionId,
          teacherId: session.user.id
        }
      })

      if (!sessionRecord) {
        return NextResponse.json(
          { error: 'Session not found or access denied' },
          { status: 404 }
        )
      }

      // Delete existing attendance for this session
      await prisma.attendance.deleteMany({
        where: {
          sessionId: validatedData.sessionId
        }
      })

      // Create new attendance records
      const attendanceRecords = await prisma.attendance.createMany({
        data: validatedData.attendanceData.map(attendance => ({
          sessionId: validatedData.sessionId,
          studentId: attendance.studentId,
          status: attendance.status,
          notes: attendance.notes,
          teacherId: session.user.id
        }))
      })

      // Update session status to completed
      await prisma.session.update({
        where: { id: validatedData.sessionId },
        data: { status: 'COMPLETED' }
      })

      // Update payment statuses for the group
      try {
        const group = await prisma.group.findUnique({
          where: { id: sessionRecord.groupId },
          select: { id: true }
        });
        if (group) {
          await updateAllPaymentStatuses(group.id);
        }
      } catch (error) {
        console.error('Failed to update payment statuses:', error);
        // Don't fail the request if payment update fails
      }

      return NextResponse.json({
        success: true,
        attendanceCount: attendanceRecords.count
      }, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating attendance:', error)
    return NextResponse.json({ error: 'Failed to create attendance' }, { status: 500 })
  }
}

// PUT /api/attendance - Update attendance records
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createAttendanceSchema.parse(body)
    const prisma = await getTenantPrisma()

    // Verify the session belongs to the current teacher
    const sessionRecord = await prisma.session.findFirst({
      where: {
        id: validatedData.sessionId,
        teacherId: session.user.id
      }
    })

    if (!sessionRecord) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    // Delete existing attendance for this session
    await prisma.attendance.deleteMany({
      where: {
        sessionId: validatedData.sessionId
      }
    })

    // Create updated attendance records
    const attendanceRecords = await prisma.attendance.createMany({
      data: validatedData.attendanceData.map(attendance => ({
        sessionId: validatedData.sessionId,
        studentId: attendance.studentId,
        status: attendance.status,
        notes: attendance.notes,
        teacherId: session.user.id
      }))
    })

    // Update payment statuses for the group
    try {
      const group = await prisma.group.findUnique({
        where: { id: sessionRecord.groupId },
        select: { id: true }
      });
      if (group) {
        await updateAllPaymentStatuses(group.id);
      }
    } catch (error) {
      console.error('Failed to update payment statuses:', error);
      // Don't fail the request if payment update fails
    }

    return NextResponse.json({
      success: true,
      attendanceCount: attendanceRecords.count
    })
  } catch (error) {
    console.error('Error updating attendance:', error)
    return NextResponse.json({ error: 'Failed to update attendance' }, { status: 500 })
  }
}