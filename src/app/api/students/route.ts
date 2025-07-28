import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getTenantPrisma, getCurrentTenantId } from '@/lib/db-tenant'
import { z } from 'zod'

const createStudentSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(1),
  classe: z.string().min(1),
  lycee: z.string().min(1),
})

// GET /api/students - Get all students
export async function GET() {
  try {
    const prisma = await getTenantPrisma()
    const session = await getServerSession(authOptions)
    const teacherId = session?.user?.userId

    const students = await prisma.student.findMany({
      where: {
        teacherId: teacherId
      },
      include: {
        groups: {
          include: {
            group: true
          }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 5
        },
        attendance: {
          include: {
            session: true
          },
          orderBy: { session: { date: 'desc' } },
          take: 10
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const serializedStudents = students.map(student => ({
      ...student,
      enrollmentDate: student.enrollmentDate ? student.enrollmentDate.toISOString() : null,
      createdAt: student.createdAt ? student.createdAt.toISOString() : null,
      updatedAt: student.updatedAt ? student.updatedAt.toISOString() : null,
      groups: student.groups.map(gs => ({
        ...gs,
        joinedAt: gs.joinedAt ? gs.joinedAt.toISOString() : null,
        leftAt: gs.leftAt ? gs.leftAt.toISOString() : null,
        group: {
          ...gs.group,
          createdAt: gs.group.createdAt ? gs.group.createdAt.toISOString() : null,
          updatedAt: gs.group.updatedAt ? gs.group.updatedAt.toISOString() : null
        }
      })),
      payments: student.payments.map(p => ({
        ...p,
        dueDate: p.dueDate ? p.dueDate.toISOString() : null,
        paidDate: p.paidDate ? p.paidDate.toISOString() : null,
        createdAt: p.createdAt ? p.createdAt.toISOString() : null,
        updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null
      })),
      attendance: student.attendance.map(a => ({
        ...a,
        createdAt: a.createdAt ? a.createdAt.toISOString() : null,
        session: {
          ...a.session,
          date: a.session.date ? a.session.date.toISOString() : null,
          createdAt: a.session.createdAt ? a.session.createdAt.toISOString() : null,
          updatedAt: a.session.updatedAt ? a.session.updatedAt.toISOString() : null
        }
      }))
    }));
    return new NextResponse(JSON.stringify(serializedStudents), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error fetching students:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

// POST /api/students - Create a new student
export async function POST(request: NextRequest) {
  try {
    const prisma = await getTenantPrisma()
    const teacherId = await getCurrentTenantId()

    const body = await request.json()
    const validatedData = createStudentSchema.parse(body)

    const student = await prisma.student.create({
      data: {
        ...validatedData,
        teacherId,
        enrollmentDate: new Date(),
      },
      include: {
        groups: {
          include: {
            group: true
          }
        },
        payments: true,
        attendance: true
      }
    })

    const serializedStudent = {
       ...student,
       enrollmentDate: student.enrollmentDate ? student.enrollmentDate.toISOString() : null,
       createdAt: student.createdAt ? student.createdAt.toISOString() : null,
       updatedAt: student.updatedAt ? student.updatedAt.toISOString() : null,
       groups: student.groups.map(gs => ({
         ...gs,
         joinedAt: gs.joinedAt ? gs.joinedAt.toISOString() : null,
         leftAt: gs.leftAt ? gs.leftAt.toISOString() : null,
         group: {
           ...gs.group,
           createdAt: gs.group.createdAt ? gs.group.createdAt.toISOString() : null,
           updatedAt: gs.group.updatedAt ? gs.group.updatedAt.toISOString() : null
         }
       })),
       payments: student.payments.map(p => ({
         ...p,
         dueDate: p.dueDate ? p.dueDate.toISOString() : null,
         paidDate: p.paidDate ? p.paidDate.toISOString() : null,
         createdAt: p.createdAt ? p.createdAt.toISOString() : null,
         updatedAt: p.updatedAt ? p.updatedAt.toISOString() : null
       })),
       attendance: student.attendance.map(a => ({
         ...a,
         createdAt: a.createdAt ? a.createdAt.toISOString() : null
       }))
     }
    return new NextResponse(JSON.stringify(serializedStudent), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Error creating student:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}