import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getTenantPrisma, getCurrentTenantId } from '@/lib/db-tenant'
import { z } from 'zod'

const createSessionSchema = z.object({
  groupId: z.string().min(1),
  date: z.string().datetime(),
  duration: z.number().min(1).optional(), // Duration in minutes, optional - will use group's default if not provided
  status: z.enum(['SCHEDULED', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getTenantPrisma()
    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('groupId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {
      group: {
        teacherId: session.user.id
      }
    }

    if (groupId) {
      where.groupId = groupId
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        group: {
          include: {
            _count: {
              select: {
                students: true
              }
            }
          }
        },
        attendance: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createSessionSchema.parse(body)
    const prisma = await getTenantPrisma()

    // Verify the group belongs to the current teacher
    const group = await prisma.group.findFirst({
      where: {
        id: validatedData.groupId,
        teacherId: session.user.id
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found or access denied' },
        { status: 404 }
      )
    }

    const newSession = await prisma.session.create({
      data: {
        ...validatedData,
        date: new Date(validatedData.date),
        duration: validatedData.duration || group.scheduleDuration || 60, // Use provided duration, group's default, or 60 minutes
        teacherId: session.user.id, // Add teacherId for multi-tenant support
      },
      include: {
        group: {
          include: {
            _count: {
              select: {
                students: true
              }
            }
          }
        },
        attendance: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      }
    })

    return NextResponse.json(newSession, { status: 201 })
  } catch (error) {
    console.error('Error creating session:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', issues: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}