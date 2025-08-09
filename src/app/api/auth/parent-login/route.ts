import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const parentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

// POST /api/auth/parent-login - Parent authentication
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = parentLoginSchema.parse(body)

    // Find parent user by email
    const parentUser = await prisma.user.findUnique({
      where: { 
        email,
        role: 'PARENT'
      },
      include: {
        parentConnections: {
          include: {
            student: {
              include: {
                user: true,
                groups: {
                  include: {
                    group: {
                      include: {
                        teacher: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!parentUser) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Check if parent account is active
    if (parentUser.status !== 'APPROVED') {
      return NextResponse.json(
        { error: 'Compte en attente d\'approbation' },
        { status: 401 }
      )
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, parentUser.password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }

    // Return parent data with connected students and groups
    const parentData = {
      id: parentUser.id,
      name: parentUser.name,
      email: parentUser.email,
      phone: parentUser.phone,
      role: parentUser.role,
      connections: parentUser.parentConnections.map(connection => ({
        id: connection.id,
        relationship: connection.relationship,
        isActive: connection.isActive,
        student: {
          id: connection.student.id,
          name: connection.student.name,
          email: connection.student.email,
          phone: connection.student.phone,
          classe: connection.student.classe,
          lycee: connection.student.lycee,
          level: connection.student.level,
          groups: connection.student.groups.map(sg => ({
            id: sg.group.id,
            name: sg.group.name,
            subject: sg.group.subject,
            teacher: {
              id: sg.group.teacher.id,
              name: sg.group.teacher.name,
              email: sg.group.teacher.email
            }
          }))
        }
      }))
    }

    return NextResponse.json({
      success: true,
      parent: parentData
    })

  } catch (error) {
    console.error('Parent login error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Données invalides', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}