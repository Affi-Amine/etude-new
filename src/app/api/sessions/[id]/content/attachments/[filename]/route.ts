import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getTenantPrisma } from '@/lib/db-tenant'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; filename: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const prisma = await getTenantPrisma()
    const sessionId = params.id
    const filename = params.filename

    // Verify the session exists and user has access (teacher only for now)
    const sessionData = await prisma.session.findFirst({
      where: {
        id: sessionId,
        teacherId: session.user.id // Teacher access only
      },
      select: { resources: true }
    })

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 404 }
      )
    }

    // Check if the file exists in session resources
    const resources = (sessionData.resources as any[]) || []
    const fileResource = resources.find(r => 
      r.type === 'file' && r.url.endsWith(filename)
    )

    if (!fileResource) {
      return NextResponse.json(
        { error: 'File not found in session resources' },
        { status: 404 }
      )
    }

    // Check if file exists on disk
    const filePath = join(process.cwd(), 'uploads', 'sessions', sessionId, filename)
    
    if (!existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File not found on disk' },
        { status: 404 }
      )
    }

    // Read and serve the file
    const fileBuffer = await readFile(filePath)
    
    // Set appropriate headers
    const headers = new Headers()
    headers.set('Content-Type', fileResource.mimeType || 'application/octet-stream')
    headers.set('Content-Length', fileBuffer.length.toString())
    headers.set('Content-Disposition', `attachment; filename="${fileResource.name}"`)
    
    return new NextResponse(fileBuffer, {
      status: 200,
      headers
    })

  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}