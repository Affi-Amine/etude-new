const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function fixStudentPassword() {
  try {
    console.log('🔐 Fixing student password...')
    
    // Find the user
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
      role: user.role,
      hasPassword: !!user.password
    })
    
    if (!user.password) {
      console.log('⚠️ User has no password, creating one...')
      
      const password = 'password123'
      const hashedPassword = await bcrypt.hash(password, 12)
      
      await prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword }
      })
      
      console.log('✅ Password created successfully!')
      console.log('🔑 Login credentials:')
      console.log('   Email:', user.email)
      console.log('   Password:', password)
    } else {
      console.log('✅ User already has a password')
      
      // Test if the password is 'password123'
      const isValidPassword = await bcrypt.compare('password123', user.password)
      if (isValidPassword) {
        console.log('✅ Password is "password123"')
      } else {
        console.log('⚠️ Password is not "password123", updating...')
        
        const password = 'password123'
        const hashedPassword = await bcrypt.hash(password, 12)
        
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword }
        })
        
        console.log('✅ Password updated to "password123"')
      }
    }
    
    // Now test the login
    console.log('\n🧪 Testing login with updated credentials...')
    
    const student = await prisma.student.findFirst({
      where: {
        email: user.email,
        isActive: true
      },
      include: {
        user: true,
        groups: {
          where: { isActive: true },
          include: {
            group: {
              select: {
                id: true,
                name: true,
                subject: true,
                scheduleDay: true,
                scheduleTime: true
              }
            }
          }
        }
      }
    })
    
    if (!student) {
      console.log('❌ Student not found or inactive')
      return
    }
    
    console.log('✅ Student found:', {
      id: student.id,
      name: student.name,
      email: student.email,
      isActive: student.isActive,
      hasUser: !!student.user,
      groupsCount: student.groups.length
    })
    
    if (!student.user) {
      console.log('❌ Student has no user account')
      return
    }
    
    const isPasswordValid = await bcrypt.compare('password123', student.user.password)
    console.log('🔑 Password validation:', isPasswordValid ? '✅ Valid' : '❌ Invalid')
    
    if (isPasswordValid) {
      console.log('\n🎉 Login should work now!')
      console.log('📋 Login details:')
      console.log('   URL: http://localhost:3001/student/login')
      console.log('   Email:', student.email)
      console.log('   Password: password123')
      
      console.log('\n📚 Student groups:')
      student.groups.forEach((groupStudent, index) => {
        console.log(`   ${index + 1}. ${groupStudent.group.name} (${groupStudent.group.subject})`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error fixing student password:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixStudentPassword()