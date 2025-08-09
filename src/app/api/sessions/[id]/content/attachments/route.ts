import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/db-tenant'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { v4 as uuidv4 } from 'uuid'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'text/plain'
]

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getTenantPrisma()
    const sessionId = params.id

    // Verify the session belongs to the current teacher
    const sessionData = await prisma.session.findFirst({
      where: {
        id: sessionId,
        teacherId: session.user.id
      }
    })

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop()
    const uniqueFilename = `${uuidv4()}.${fileExtension}`
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', 'sessions', sessionId)
    await mkdir(uploadDir, { recursive: true })
    
    // Save file to disk
    const filePath = join(uploadDir, uniqueFilename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Update session resources in database
    const currentSession = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { resources: true }
    })

    const currentResources = (currentSession?.resources as any[]) || []
    const newResource = {
      id: uuidv4(),
      type: 'file',
      name: file.name,
      url: `/api/sessions/${sessionId}/content/attachments/${uniqueFilename}`,
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
      uploadedBy: session.user.id
    }

    const updatedResources = [...currentResources, newResource]

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        resources: updatedResources
      }
    })

    return NextResponse.json({
      success: true,
      resource: newResource
    }, { status: 201 })

  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getTenantPrisma()
    const sessionId = params.id
    const { searchParams } = new URL(request.url)
    const resourceId = searchParams.get('resourceId')

    if (!resourceId) {
      return NextResponse.json({ error: 'Resource ID required' }, { status: 400 })
    }

    // Verify the session belongs to the current teacher
    const sessionData = await prisma.session.findFirst({
      where: {
        id: sessionId,
        teacherId: session.user.id
      },
      select: { resources: true }
    })

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    const currentResources = (sessionData.resources as any[]) || []
    const resourceToDelete = currentResources.find(r => r.id === resourceId)

    if (!resourceToDelete) {
      return NextResponse.json(
        { error: 'Resource not found' },
        { status: 404 }
      )
    }

    // Remove resource from database
    const updatedResources = currentResources.filter(r => r.id !== resourceId)
    
    await prisma.session.update({
      where: { id: sessionId },
      data: {
        resources: updatedResources
      }
    })

    // TODO: Delete physical file from disk
    // This would require extracting the filename from the URL and removing the file

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}