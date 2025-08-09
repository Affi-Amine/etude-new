import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/db-tenant'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getTenantPrisma()
    const groupId = params.id
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Verify the group belongs to the current teacher
    const group = await prisma.group.findFirst({
      where: {
        id: groupId,
        teacherId: session.user.id
      },
      select: {
        id: true,
        name: true,
        subject: true
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 404 }
      )
    }

    // Get session history with course content
    const sessions = await prisma.session.findMany({
      where: {
        groupId: groupId,
        teacherId: session.user.id,
        status: 'COMPLETED' // Only show completed sessions in history
      },
      select: {
        id: true,
        date: true,
        duration: true,
        title: true,
        description: true,
        objectives: true,
        materials: true,
        homework: true,
        resources: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
        attendance: {
          select: {
            id: true,
            status: true,
            student: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: limit,
      skip: offset
    })

    // Get total count for pagination
    const totalCount = await prisma.session.count({
      where: {
        groupId: groupId,
        teacherId: session.user.id,
        status: 'COMPLETED'
      }
    })

    // Calculate attendance rate for each session
    const sessionsWithStats = sessions.map(session => {
      const totalStudents = session.attendance.length
      const presentStudents = session.attendance.filter(att => att.status === 'PRESENT').length
      const attendanceRate = totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0

      return {
        ...session,
        attendanceRate: Math.round(attendanceRate),
        totalStudents,
        presentStudents
      }
    })

    return NextResponse.json({
      group,
      sessions: sessionsWithStats,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching session history:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}