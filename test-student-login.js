const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testStudentLogin() {
  try {
    console.log('🔐 Testing student login and session data...')
    
    // Find the student user
    const user = await prisma.user.findUnique({
      where: { email: 'affi.amin.work@gmail.com' },
      include: {
        studentProfile: true
      }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('👤 User found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      hasStudentProfile: !!user.studentProfile
    })
    
    if (!user.studentProfile) {
      console.log('❌ No student profile linked to this user')
      
      // Check if there's a student with this email but not linked
      const unlinkedStudent = await prisma.student.findUnique({
        where: { email: user.email }
      })
      
      if (unlinkedStudent) {
        console.log('⚠️ Found unlinked student:', {
          studentId: unlinkedStudent.id,
          studentUserId: unlinkedStudent.userId,
          userIdNeeded: user.id
        })
        
        // Link the student to the user
        console.log('🔗 Linking student to user...')
        await prisma.student.update({
          where: { id: unlinkedStudent.id },
          data: { userId: user.id }
        })
        
        console.log('✅ Student linked to user successfully!')
        
        // Verify the link
        const updatedUser = await prisma.user.findUnique({
          where: { id: user.id },
          include: {
            studentProfile: true
          }
        })
        
        console.log('🔍 Verification - User now has student profile:', !!updatedUser.studentProfile)
        
        if (updatedUser.studentProfile) {
          console.log('📋 Student profile details:', {
            id: updatedUser.studentProfile.id,
            name: updatedUser.studentProfile.name,
            email: updatedUser.studentProfile.email,
            userId: updatedUser.studentProfile.userId
          })
        }
      }
    } else {
      console.log('✅ Student profile already linked:', {
        studentId: user.studentProfile.id,
        studentName: user.studentProfile.name
      })
    }
    
    console.log('\n🎯 Now testing the API flow with proper user session...')
    
    // Simulate the API call with the user session
    const studentProfile = await prisma.student.findFirst({
      where: { userId: user.id }
    })
    
    if (!studentProfile) {
      console.log('❌ Still no student profile found after linking attempt')
      return
    }
    
    console.log('✅ Student profile found for API simulation:', {
      id: studentProfile.id,
      name: studentProfile.name
    })
    
    // Get student's groups
    const studentGroups = await prisma.groupStudent.findMany({
      where: {
        studentId: studentProfile.id,
        isActive: true
      },
      select: { groupId: true }
    })
    
    console.log('📚 Active groups:', studentGroups.length)
    
    const groupIds = studentGroups.map(sg => sg.groupId)
    
    if (groupIds.length === 0) {
      console.log('❌ No active groups found')
      return
    }
    
    // Get sessions
    const sessions = await prisma.session.findMany({
      where: {
        groupId: { in: groupIds }
      },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            subject: true
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
      take: 10
    })
    
    console.log('📅 Sessions found:', sessions.length)
    
    if (sessions.length > 0) {
      console.log('\n📋 Sample sessions:')
      sessions.slice(0, 5).forEach((session, index) => {
        console.log(`${index + 1}. ${session.date} - ${session.group.name} - ${session.title || 'No title'} (${session.status})`)
      })
    }
    
    console.log('\n✅ Student login test completed successfully!')
    console.log('📊 Summary:', {
      userFound: !!user,
      studentProfileLinked: !!studentProfile,
      activeGroups: groupIds.length,
      sessionsAvailable: sessions.length
    })
    
  } catch (error) {
    console.error('❌ Error testing student login:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testStudentLogin()