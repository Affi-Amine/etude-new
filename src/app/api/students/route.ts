import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getTenantPrisma, getCurrentTenantId } from '@/lib/db-tenant'
import { z } from 'zod'

// Function to sanitize input strings
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>"'&]/g, (match) => {
      const entities: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;'
      }
      return entities[match] || match
    })
}

const createStudentSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Le nom est trop long'),
  email: z.string().email('Format d\'email invalide').min(1, 'L\'email est requis').max(255, 'L\'email est trop long'),
  phone: z.string().min(8, 'Le numéro de téléphone doit contenir au moins 8 chiffres').max(20, 'Le numéro de téléphone est trop long').regex(/^[+]?[0-9\s\-\(\)]+$/, 'Format de téléphone invalide'),
  niveau: z.string().min(1, 'Le niveau est requis').max(50, 'Le niveau est trop long'),
  section: z.string().min(1, 'La section est requise').max(50, 'La section est trop longue'),
  lycee: z.string().min(1, 'Le lycée est requis').max(100, 'Le lycée est trop long'),
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

    // Sanitize input data
    const sanitizedData = {
      name: sanitizeInput(validatedData.name),
      email: validatedData.email.toLowerCase().trim(), // Email normalization
      phone: validatedData.phone.replace(/\s/g, ''), // Remove spaces from phone
      niveau: sanitizeInput(validatedData.niveau),
      section: sanitizeInput(validatedData.section),
      lycee: sanitizeInput(validatedData.lycee),
    }

    // Check if email already exists
     const existingStudent = await prisma.student.findFirst({
       where: { 
         email: sanitizedData.email,
         teacherId // Only check within the same teacher's students
       }
     })

     if (existingStudent) {
       return NextResponse.json(
         { error: 'Un étudiant avec cet email existe déjà' },
         { status: 400 }
       )
     }

     // Also check if email exists in User table
     const existingUser = await prisma.user.findUnique({
       where: { email: sanitizedData.email }
     })

     if (existingUser) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé par un autre compte' },
          { status: 400 }
        )
      }
 
      // Check if phone number already exists
      const existingStudentByPhone = await prisma.student.findFirst({
        where: { 
          phone: sanitizedData.phone,
          teacherId // Only check within the same teacher's students
        }
      })
 
      if (existingStudentByPhone) {
        return NextResponse.json(
          { error: 'Un étudiant avec ce numéro de téléphone existe déjà' },
          { status: 400 }
        )
      }

    const student = await prisma.student.create({
       data: {
         name: sanitizedData.name,
         email: sanitizedData.email,
         phone: sanitizedData.phone,
         niveau: sanitizedData.niveau,
         section: sanitizedData.section,
         lycee: sanitizedData.lycee,
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
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Données invalides', 
          details: error.errors.map(e => e.message)
        },
        { status: 400 }
      )
    }
    
    // Handle Prisma unique constraint errors
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Un étudiant avec ces informations existe déjà' },
        { status: 400 }
      )
    }
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Generic error (don't expose internal details)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la création de l\'étudiant' },
      { status: 500 }
    )
  }
}

// DELETE /api/students - Delete a student
export async function DELETE(request: NextRequest) {
  try {
    const prisma = await getTenantPrisma()
    const session = await getServerSession(authOptions)
    const teacherId = session?.user?.userId

    if (!teacherId) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('id')

    if (!studentId) {
      return NextResponse.json(
        { error: 'ID de l\'étudiant requis' },
        { status: 400 }
      )
    }

    // Check if student exists and belongs to the teacher
    const student = await prisma.student.findFirst({
      where: {
        id: studentId,
        teacherId: teacherId
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Étudiant non trouvé ou non autorisé' },
        { status: 404 }
      )
    }

    // Delete the student (this will cascade delete related records)
    await prisma.student.delete({
      where: {
        id: studentId
      }
    })

    return NextResponse.json(
      { message: 'Étudiant supprimé avec succès' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting student:', error)
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }
    
    // Generic error (don't expose internal details)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la suppression de l\'étudiant' },
      { status: 500 }
    )
  }
}