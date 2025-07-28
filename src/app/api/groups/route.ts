import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getTenantPrisma, getCurrentTenantId } from '@/lib/db-tenant'
import { z } from 'zod'

const createGroupSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  schedule: z.object({
    day: z.string().min(1),
    time: z.string().min(1),
    duration: z.number().min(1)
  }),
  paymentConfig: z.object({
    monthlyFee: z.number().min(0),
    sessionFee: z.number().optional(),
    registrationFee: z.number().optional(),
    paymentDeadline: z.number().min(1),
    countAbsentSessions: z.boolean().optional()
  }),
  studentIds: z.array(z.string()).optional().default([]),
})

const createNewGroupSchema = z.object({
  name: z.string().min(1),
  subject: z.string().min(1),
  weeklySchedule: z.array(z.object({
    dayOfWeek: z.enum(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']),
    startTime: z.string().min(1),
    duration: z.number().min(30)
  })).min(1),
  sessionFee: z.number().min(0),
  paymentThreshold: z.number().min(1),
  registrationFee: z.number().optional(),
  semesterStartDate: z.string().transform(str => new Date(str)),
  semesterEndDate: z.string().transform(str => new Date(str)),
  studentIds: z.array(z.string()).optional().default([]),
})

// GET /api/groups - Get all groups
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getTenantPrisma()

    const groups = await prisma.group.findMany({
      where: {
        teacherId: session.user.userId
      },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                classe: true,
                level: true,
              }
            }
          }
        },
        sessions: {
          orderBy: { date: 'desc' },
          take: 5,
          include: {
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
        },
        _count: {
          select: {
            students: true,
            sessions: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to generate sessions for a semester based on weekly schedule
async function generateSemesterSessions(
  prisma: any,
  groupId: string,
  teacherId: string,
  weeklySchedule: Array<{
    dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
    startTime: string;
    duration: number;
  }>,
  semesterStart: Date,
  semesterEnd: Date
) {
  const sessions = []
  const dayMap = {
    MONDAY: 1,
    TUESDAY: 2,
    WEDNESDAY: 3,
    THURSDAY: 4,
    FRIDAY: 5,
    SATURDAY: 6,
    SUNDAY: 0
  }

  // Generate sessions for each week in the semester
  for (const schedule of weeklySchedule) {
    const targetDay = dayMap[schedule.dayOfWeek]
    let currentDate = new Date(semesterStart)
    
    // Find the first occurrence of the target day
    while (currentDate.getDay() !== targetDay) {
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // Generate sessions for this day throughout the semester
    while (currentDate <= semesterEnd) {
      const sessionDate = new Date(currentDate)
      const [hours, minutes] = schedule.startTime.split(':').map(Number)
      sessionDate.setHours(hours, minutes, 0, 0)
      
      sessions.push({
        groupId,
        teacherId,
        date: sessionDate,
        duration: schedule.duration,
        status: 'SCHEDULED' as const,
        createdAt: new Date(),
      })
      
      // Move to next week
      currentDate.setDate(currentDate.getDate() + 7)
    }
  }

  // Create all sessions in the database
  if (sessions.length > 0) {
    await prisma.session.createMany({
      data: sessions
    })
  }

  return sessions.length
}

// POST /api/groups - Create a new group
export async function POST(request: NextRequest) {
  try {
    const prisma = await getTenantPrisma()
    const teacherId = await getCurrentTenantId()

    const body = await request.json()
    
    // Detect if this is the new multi-session format
    const isNewFormat = body.weeklySchedule !== undefined
    
    if (isNewFormat) {
      // Handle new multi-session group creation
      const validatedData = createNewGroupSchema.parse(body)
      
      // Create the group with new format
      const group = await prisma.group.create({
        data: {
          name: validatedData.name,
          subject: validatedData.subject,
          sessionFee: validatedData.sessionFee,
          paymentThreshold: validatedData.paymentThreshold,
          registrationFee: validatedData.registrationFee,
          semesterStartDate: validatedData.semesterStartDate,
          semesterEndDate: validatedData.semesterEndDate,
          // Store weekly schedule as JSON
          weeklySchedule: validatedData.weeklySchedule,
          teacherId,
        },
        include: {
          students: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  classe: true,
                  level: true,
                }
              }
            }
          },
          _count: {
            select: {
              students: true,
              sessions: true
            }
          }
        }
      })
      
      // Add students to the group if provided
      if (validatedData.studentIds.length > 0) {
        await prisma.groupStudent.createMany({
          data: validatedData.studentIds.map(studentId => ({
            groupId: group.id,
            studentId,
            teacherId,
          }))
        })
      }
      
      // Generate sessions for the semester based on weekly schedule
      await generateSemesterSessions(prisma, group.id, teacherId, validatedData.weeklySchedule, validatedData.semesterStartDate, validatedData.semesterEndDate)
      
      // Fetch the updated group with students and sessions
      const updatedGroup = await prisma.group.findUnique({
        where: { id: group.id },
        include: {
          students: {
            include: {
              student: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  classe: true,
                  level: true,
                }
              }
            }
          },
          sessions: {
            orderBy: { date: 'desc' },
            take: 5,
            include: {
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
          },
          _count: {
            select: {
              students: true,
              sessions: true
            }
          }
        }
      })
      
      return NextResponse.json({ success: true, group: updatedGroup })
    } else {
      // Handle legacy single-session group creation
      const validatedData = createGroupSchema.parse(body)

      // Create the group
      const group = await prisma.group.create({
        data: {
          name: validatedData.name,
          subject: validatedData.subject,
          scheduleDay: validatedData.schedule.day,
          scheduleTime: validatedData.schedule.time,
          scheduleDuration: validatedData.schedule.duration,
          monthlyFee: validatedData.paymentConfig.monthlyFee,
          sessionFee: validatedData.paymentConfig.sessionFee,
          registrationFee: validatedData.paymentConfig.registrationFee,
          paymentDeadline: validatedData.paymentConfig.paymentDeadline,
          teacherId,
        },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                classe: true,
                level: true,
              }
            }
          }
        },
        _count: {
          select: {
            students: true,
            sessions: true
          }
        }
      }
    })

      // Add students to the group if provided
      if (validatedData.studentIds.length > 0) {
        await prisma.groupStudent.createMany({
          data: validatedData.studentIds.map(studentId => ({
            groupId: group.id,
            studentId,
            teacherId,
          }))
        })

        // Fetch the updated group with students
        const updatedGroup = await prisma.group.findUnique({
          where: { id: group.id },
          include: {
            students: {
              include: {
                student: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    classe: true,
                    level: true,
                  }
                }
              }
            },
            _count: {
              select: {
                students: true,
                sessions: true
              }
            }
          }
        })

        return NextResponse.json(updatedGroup, { status: 201 })
      }

      return NextResponse.json(group, { status: 201 })
    }
  } catch (error) {
    console.error('Error creating group:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}