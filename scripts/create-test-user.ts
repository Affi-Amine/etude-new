import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestUser() {
  try {
    // Create test teacher
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const teacher = await prisma.user.upsert({
      where: { email: 'test@teacher.com' },
      update: {},
      create: {
        name: 'Test Teacher',
        email: 'test@teacher.com',
        password: hashedPassword,
        phone: '+216 12 345 678',
        role: 'TEACHER',
        status: 'ACTIVE',
        isActive: true
      }
    })
    
    console.log('Test teacher created:', teacher.email)
    console.log('Password: password123')
    
  } catch (error) {
    console.error('Error creating test user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createTestUser()