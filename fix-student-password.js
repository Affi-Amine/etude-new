const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function fixStudentPassword() {
  try {
    console.log('🔧 Fixing Amine student password...')
    
    // Find Amine's user account
    const user = await prisma.user.findUnique({
      where: {
        email: 'affi.amin.prof@gmail.com'
      }
    })
    
    if (!user) {
      console.log('❌ User not found')
      return
    }
    
    console.log('✅ User found:', user.email)
    
    // Hash the correct password
    const hashedPassword = await bcrypt.hash('test123', 12)
    
    // Update the password
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        password: hashedPassword
      }
    })
    
    console.log('✅ Password updated successfully for:', user.email)
    console.log('🔑 New password: test123')
    
  } catch (error) {
    console.error('❌ Error fixing password:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixStudentPassword()