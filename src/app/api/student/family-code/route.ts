import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Generate a 6-digit family code
function generateFamilyCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// POST /api/student/family-code - Generate family code for parent connection
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find student profile
    const student = await prisma.student.findFirst({
      where: {
        userId: session.user.id,
        isActive: true
      },
      include: {
        teacher: {
          select: {
            name: true,
            email: true
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
        { error: 'Student profile not found' },
        { status: 404 }
      )
    }

    // Generate unique family code
    let familyCode: string
    let isUnique = false
    let attempts = 0
    
    do {
      familyCode = generateFamilyCode()
      const existing = await prisma.parentConnection.findUnique({
        where: { familyCode }
      })
      isUnique = !existing
      attempts++
    } while (!isUnique && attempts < 10)

    if (!isUnique) {
      return NextResponse.json(
        { error: 'Failed to generate unique family code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      familyCode,
      student: {
        id: student.id,
        name: student.name,
        classe: student.classe,
        lycee: student.lycee,
        teacher: student.teacher,
        groups: student.groups.map(gs => gs.group)
      },
      joinUrl: `${process.env.NEXTAUTH_URL}/parent/join/${familyCode}`
    })

  } catch (error) {
    console.error('Generate family code error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/student/family-code - Get existing family connections
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'STUDENT') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Find student profile
    const student = await prisma.student.findFirst({
      where: {
        userId: session.user.id,
        isActive: true
      }
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student profile not found' },
        { status: 404 }
      )
    }

    // Get parent connections
    const connections = await prisma.parentConnection.findMany({
      where: {
        studentId: student.id,
        isActive: true
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      success: true,
      connections: connections.map(conn => ({
        id: conn.id,
        relationship: conn.relationship,
        createdAt: conn.createdAt,
        parent: conn.parent
      }))
    })

  } catch (error) {
    console.error('Get family connections error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}