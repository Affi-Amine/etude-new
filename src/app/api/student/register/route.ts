import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const studentRegisterSchema = z.object({
  invitationCode: z.string().length(6, 'Le code d\'invitation doit contenir exactement 6 caractères'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string().email('Format d\'email invalide').min(1, 'L\'email est requis'),
  phone: z.string().min(8, 'Le numéro de téléphone doit contenir au moins 8 chiffres').max(15, 'Le numéro de téléphone ne peut pas dépasser 15 chiffres').regex(/^[0-9+\-\s()]+$/, 'Le numéro de téléphone contient des caractères invalides'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  lycee: z.string().min(1, 'Le lycée est requis').max(100, 'Le lycée ne peut pas dépasser 100 caractères'),
  niveau: z.string().min(1, 'Le niveau est requis').max(50, 'Le niveau ne peut pas dépasser 50 caractères'),
  section: z.string().min(1, 'La section est requise').max(50, 'La section ne peut pas dépasser 50 caractères'),
})

// Function to sanitize input data
function sanitizeInput(input: string): string {
  return input
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
    .trim()
}

// POST /api/student/register - Student self-registration with invitation code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = studentRegisterSchema.parse(body)
    
    // Sanitize input data
    const sanitizedData = {
      invitationCode: validatedData.invitationCode.trim(),
      name: sanitizeInput(validatedData.name),
      email: validatedData.email.toLowerCase().trim(),
      phone: validatedData.phone.replace(/\s/g, ''), // Remove spaces
      password: validatedData.password, // Don't sanitize password
      lycee: sanitizeInput(validatedData.lycee),
      niveau: sanitizeInput(validatedData.niveau),
      section: sanitizeInput(validatedData.section)
    }

    // Find and validate invitation
     const invitation = await prisma.groupInvitation.findUnique({
       where: {
         code: sanitizedData.invitationCode,
       },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            subject: true,
            teacherId: true
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation code' },
        { status: 400 }
      )
    }

    if (!invitation.isActive) {
      return NextResponse.json(
        { error: 'Invitation code is no longer active' },
        { status: 400 }
      )
    }

    if (invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation code has expired' },
        { status: 400 }
      )
    }

    if (invitation.currentUses >= invitation.maxUses) {
      return NextResponse.json(
        { error: 'Invitation code has reached maximum uses' },
        { status: 400 }
      )
    }

    // Check if email already exists
     const existingUser = await prisma.user.findUnique({
       where: { email: sanitizedData.email }
     })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Check if student already exists with this email
     const existingStudent = await prisma.student.findFirst({
       where: { email: sanitizedData.email }
     })

    if (existingStudent) {
      return NextResponse.json(
        { error: 'Student with this email already exists' },
        { status: 400 }
      )
    }

    // Hash password
     const hashedPassword = await bcrypt.hash(sanitizedData.password, 12)

    // Create user account and student profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user account
       const user = await tx.user.create({
         data: {
           email: sanitizedData.email,
           name: sanitizedData.name,
           password: hashedPassword,
           role: 'STUDENT',
           status: 'APPROVED', // Auto-approve students who register with valid codes
           phone: sanitizedData.phone,
         }
       })

      // Create student profile
       const student = await tx.student.create({
         data: {
           teacherId: invitation.group.teacherId,
           userId: user.id,
           name: sanitizedData.name,
           email: sanitizedData.email,
           phone: sanitizedData.phone,
           lycee: sanitizedData.lycee,
           niveau: sanitizedData.niveau,
           section: sanitizedData.section,
           enrollmentDate: new Date(),
         }
       })

      // Add student to the group
      await tx.groupStudent.create({
        data: {
          groupId: invitation.group.id,
          studentId: student.id,
          teacherId: invitation.group.teacherId,
        }
      })

      // Update invitation usage count
      await tx.groupInvitation.update({
        where: { id: invitation.id },
        data: {
          currentUses: invitation.currentUses + 1
        }
      })

      return { user, student }
    })

    // Generate family code for parent connections
    const familyCode = Math.floor(100000 + Math.random() * 900000).toString()

    return NextResponse.json({
      success: true,
      message: 'Registration successful',
      student: {
        id: result.student.id,
        name: result.student.name,
        email: result.student.email,
        familyCode, // This will be stored separately when needed
      },
      group: {
        id: invitation.group.id,
        name: invitation.group.name,
        subject: invitation.group.subject,
      }
    })

  } catch (error) {
    console.error('Student registration error:', error)
    
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
        { error: 'Un compte avec ces informations existe déjà' },
        { status: 400 }
      )
    }
    
    // Generic error (don't expose internal details)
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de l\'inscription' },
      { status: 500 }
    )
  }
}

// GET /api/student/register?code=123456 - Validate invitation code and get group info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid invitation code format' },
        { status: 400 }
      )
    }

    const invitation = await prisma.groupInvitation.findUnique({
      where: { code },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            subject: true,
            scheduleDay: true,
            scheduleTime: true,
          }
        },
        teacher: {
          select: {
            name: true,
            email: true,
          }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json(
        { error: 'Invalid invitation code' },
        { status: 404 }
      )
    }

    if (!invitation.isActive || invitation.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Invitation code is expired or inactive' },
        { status: 400 }
      )
    }

    if (invitation.currentUses >= invitation.maxUses) {
      return NextResponse.json(
        { error: 'Invitation code has reached maximum uses' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      invitation: {
        group: invitation.group,
        teacher: invitation.teacher,
        usesRemaining: invitation.maxUses - invitation.currentUses,
        expiresAt: invitation.expiresAt,
      }
    })

  } catch (error) {
    console.error('Validate invitation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}