const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testApiLogic() {
  try {
    console.log('🧪 Testing API logic for student sessions...')
    
    // Find the user (simulating session.user.id)
    const user = await prisma.user.findUnique({
      where: { email: 'affi.amin.work@gmail.com' }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('👤 User found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    })
    
    // Simulate the API logic: get student profile
    const studentProfile = await prisma.student.findFirst({
      where: { userId: user.id }
    })
    
    if (!studentProfile) {
      console.log('❌ Student profile not found for userId:', user.id)
      
      // Check if student exists with email instead
      const studentByEmail = await prisma.student.findUnique({
        where: { email: user.email }
      })
      
      if (studentByEmail) {
        console.log('⚠️ Student found by email but not linked to user:', {
          studentId: studentByEmail.id,
          studentUserId: studentByEmail.userId,
          userIdFromSession: user.id
        })
      }
      
      return
    }
    
    console.log('✅ Student profile found:', {
      id: studentProfile.id,
      name: studentProfile.name,
      userId: studentProfile.userId
    })
    
    // Get student's groups (API logic)
    const studentGroups = await prisma.groupStudent.findMany({
      where: {
        studentId: studentProfile.id,
        isActive: true
      },
      select: { groupId: true }
    })
    
    console.log('📚 Student groups:', studentGroups.length)
    
    const groupIds = studentGroups.map(sg => sg.groupId)
    
    if (groupIds.length === 0) {
      console.log('❌ No active groups found for student')
      return
    }
    
    console.log('🔍 Group IDs:', groupIds)
    
    // Get sessions for student's groups (API logic)
    const sessions = await prisma.session.findMany({
      where: {
        groupId: { in: groupIds }
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            subject: true,
            scheduleDay: true,
            scheduleTime: true
          }
        },
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        attendance: {
          where: { studentId: studentProfile.id },
          select: {
            id: true,
            status: true,
            notes: true,
            createdAt: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 50
    })
    
    console.log('📅 Sessions found:', sessions.length)
    
    // Format sessions (API logic)
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      date: session.date,
      duration: session.duration,
      status: session.status,
      title: session.title,
      description: session.description,
      group: session.group,
      teacher: session.teacher,
      attendance: session.attendance[0] || null
    }))
    
    console.log('\n📋 Formatted sessions:')
    formattedSessions.forEach((session, index) => {
      console.log(`${index + 1}. ${session.date} - ${session.group.name} - ${session.title || 'No title'} (${session.status})`, {
        teacher: session.teacher.name,
        attendance: session.attendance ? session.attendance.status : 'No attendance'
      })
    })
    
    console.log('\n✅ API logic test completed successfully!')
    console.log('📊 Final result:', {
      sessionsCount: formattedSessions.length,
      groupsCount: groupIds.length
    })
    
  } catch (error) {
    console.error('❌ Error testing API logic:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testApiLogic()