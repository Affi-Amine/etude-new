import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const parentRegisterSchema = z.object({
  familyCode: z.string().length(6, 'Le code famille doit contenir exactement 6 caractères'),
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  email: z.string().email('Format d\'email invalide').or(z.literal('')).optional(),
  phone: z.string().min(8, 'Le numéro de téléphone doit contenir au moins 8 chiffres').max(15, 'Le numéro de téléphone ne peut pas dépasser 15 chiffres').regex(/^[0-9+\-\s()]+$/, 'Le numéro de téléphone contient des caractères invalides'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères').max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  relationship: z.enum(['parent', 'guardian', 'tutor', 'other'], { errorMap: () => ({ message: 'Relation invalide' }) }),
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

// POST /api/parent/register - Parent self-registration with family code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = parentRegisterSchema.parse(body)
    
    // Sanitize input data
    const sanitizedData = {
      familyCode: validatedData.familyCode.trim(),
      name: sanitizeInput(validatedData.name),
      email: validatedData.email ? validatedData.email.toLowerCase().trim() : '',
      phone: validatedData.phone.replace(/\s/g, ''), // Remove spaces
      password: validatedData.password, // Don't sanitize password
      relationship: validatedData.relationship
    }

    // Check if email already exists (only if email is provided and not empty)
    if (sanitizedData.email && sanitizedData.email !== '') {
      const existingUser = await prisma.user.findUnique({
        where: { email: sanitizedData.email }
      })

      if (existingUser) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 400 }
        )
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(sanitizedData.password, 12)

    // First, find the student with this family code
    const student = await prisma.student.findFirst({
      where: {
        familyCode: sanitizedData.familyCode,
        isActive: true
      },
      include: {
        user: true
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Invalid family code' },
        { status: 400 }
      )
    }

    // Create user account and parent connection in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create parent user account
      const parentUser = await tx.user.create({
        data: {
          ...(sanitizedData.email && sanitizedData.email !== '' && { email: sanitizedData.email }),
          name: sanitizedData.name,
          password: hashedPassword,
          role: 'PARENT',
          status: 'APPROVED', // Auto-approve parents who register with valid family codes
          phone: sanitizedData.phone,
        }
      })

      // Create parent connection
      const parentConnection = await tx.parentConnection.create({
        data: {
          parentUserId: parentUser.id,
          studentUserId: student.userId || '',
          studentId: student.id,
          familyCode: sanitizedData.familyCode,
          relationship: sanitizedData.relationship,
          isActive: true, // Active immediately since family code is valid
        }
      })

      return { parentUser, parentConnection }
    })

    return NextResponse.json({
      success: true,
      message: 'Registration successful. Waiting for student confirmation.',
      parent: {
        id: result.parentUser.id,
        name: result.parentUser.name,
        email: result.parentUser.email,
        familyCode: sanitizedData.familyCode,
      }
    })

  } catch (error) {
    console.error('Parent registration error:', error)
    
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

// GET /api/parent/register?code=123456 - Validate family code and get student info
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code || code.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid family code format' },
        { status: 400 }
      )
    }

    // Find student by family code
    const student = await prisma.student.findFirst({
      where: {
        familyCode: code,
        isActive: true
      },
      include: {
        teacher: {
          select: {
            name: true
          }
        },
        groups: {
          where: { isActive: true },
          include: {
            group: {
              select: {
                name: true,
                subject: true
              }
            }
          }
        }
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Invalid family code' },
        { status: 404 }
      )
    }

    // Get the primary group (first active group)
    const primaryGroup = student.groups[0]?.group

    return NextResponse.json({
      success: true,
      familyCode: code,
      student: {
        name: student.name,
        email: student.email
      },
      group: primaryGroup ? {
        name: primaryGroup.name,
        subject: primaryGroup.subject
      } : null,
      teacher: {
        name: student.teacher.name
      }
    })

  } catch (error) {
    console.error('Validate family code error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}