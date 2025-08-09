import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const querySchema = z.object({
  studentId: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED', 'POSTPONED']).nullable().optional(),
  limit: z.string().nullable().transform((val) => val ? Number(val) : 50).optional(),
})

// GET /api/student/sessions - Get sessions for a student
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const { studentId, groupId, status, limit } = querySchema.parse({
      studentId: searchParams.get('studentId'),
      groupId: searchParams.get('groupId'),
      status: searchParams.get('status'),
      limit: searchParams.get('limit') || '50',
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

    // Get student's groups
    const studentGroups = await prisma.groupStudent.findMany({
      where: {
        studentId: targetStudentId,
        isActive: true,
        ...(groupId && { groupId })
      },
      select: { groupId: true }
    })

    const groupIds = studentGroups.map(sg => sg.groupId)

    if (groupIds.length === 0) {
      return NextResponse.json({ sessions: [] })
    }

    // Get sessions for student's groups
    const sessions = await prisma.session.findMany({
      where: {
        groupId: { in: groupIds },
        ...(status && { status })
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            subject: true,
            scheduleDay: true,
            scheduleTime: true
          }
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        attendance: {
          where: { studentId: targetStudentId },
          select: {
            id: true,
            status: true,
            notes: true,
            createdAt: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: limit
    })

    // Format sessions for student view
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      date: session.date,
      duration: session.duration,
      status: session.status,
      title: session.title,
      description: session.description,
      objectives: session.objectives,
      materials: session.materials,
      homework: session.homework,
      resources: session.resources,
      notes: session.notes,
      group: session.group,
      teacher: session.teacher,
      attendance: session.attendance[0] || null,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt
    }))

    return NextResponse.json({ sessions: formattedSessions })

  } catch (error) {
    console.error('Error fetching student sessions:', error)
    
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