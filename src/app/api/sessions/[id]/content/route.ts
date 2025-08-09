import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/db-tenant'
import { z } from 'zod'

const updateContentSchema = z.object({
  title: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  objectives: z.array(z.string()).nullable().optional(),
  materials: z.array(z.string()).nullable().optional(),
  homework: z.string().nullable().optional(),
  resources: z.array(z.object({
    type: z.enum(['file', 'link', 'document']),
    name: z.string(),
    url: z.string(),
    size: z.number().optional()
  })).nullable().optional(),
})

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getTenantPrisma()
    const sessionId = params.id

    const sessionData = await prisma.session.findFirst({
      where: {
        id: sessionId,
        teacherId: session.user.id
      },
      select: {
        id: true,
        title: true,
        description: true,
        objectives: true,
        materials: true,
        homework: true,
        resources: true,
        date: true,
        group: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        }
      }
    })

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json(sessionData)
  } catch (error) {
    console.error('Error fetching session content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateContentSchema.parse(body)
    const prisma = await getTenantPrisma()
    const sessionId = params.id

    // Verify the session belongs to the current teacher
    const existingSession = await prisma.session.findFirst({
      where: {
        id: sessionId,
        teacherId: session.user.id
      }
    })

    if (!existingSession) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    // Prepare data for Prisma update
    const updateData: any = {
      updatedAt: new Date()
    }
    
    // Only include fields that are provided
    if (validatedData.title !== undefined) {
      updateData.title = validatedData.title
    }
    if (validatedData.description !== undefined) {
      updateData.description = validatedData.description
    }
    if (validatedData.homework !== undefined) {
      updateData.homework = validatedData.homework
    }
    if (validatedData.objectives !== undefined) {
      updateData.objectives = validatedData.objectives || []
    }
    if (validatedData.materials !== undefined) {
      updateData.materials = validatedData.materials || []
    }
    if (validatedData.resources !== undefined) {
      updateData.resources = validatedData.resources
    }

    const updatedSession = await prisma.session.update({
      where: {
        id: sessionId
      },
      data: updateData,
      include: {
        group: {
          select: {
            id: true,
            name: true,
            subject: true
          }
        }
      }
    })

    return NextResponse.json(updatedSession)
  } catch (error) {
    console.error('Error updating session content:', error)
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