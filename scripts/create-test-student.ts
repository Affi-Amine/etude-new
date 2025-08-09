import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestStudent() {
  try {
    console.log('Creating test student account...')

    // First, find an existing teacher
    const teacher = await prisma.user.findFirst({
      where: { role: 'TEACHER' }
    })

    if (!teacher) {
      console.error('No teacher found. Please create a teacher account first.')
      return
    }

    console.log(`Found teacher: ${teacher.name} (${teacher.email})`)

    // Create a user account for the student
    const hashedPassword = await bcrypt.hash('student123', 12)
    
    const studentUser = await prisma.user.create({
      data: {
        name: 'Marie Dupont',
        email: 'marie.dupont@student.com',
        password: hashedPassword,
        role: 'STUDENT',
        status: 'APPROVED'
      }
    })

    console.log(`Created student user: ${studentUser.name} (${studentUser.email})`)

    // Create the student profile
    const student = await prisma.student.create({
      data: {
        name: 'Marie Dupont',
        email: 'marie.dupont@student.com',
        phone: '+33 6 12 34 56 78',
        classe: 'Terminale S',
        lycee: 'Lycée Victor Hugo',
        teacherId: teacher.id,
        userId: studentUser.id,
        isActive: true
      }
    })

    console.log(`Created student profile: ${student.name}`)

    // Find or create a test group
    let group = await prisma.group.findFirst({
      where: { teacherId: teacher.id }
    })

    if (!group) {
      group = await prisma.group.create({
        data: {
          name: 'Mathématiques Terminale',
          subject: 'Mathématiques',
          scheduleDay: 'MONDAY',
          scheduleTime: '14:00',
          scheduleDuration: 120,
          monthlyFee: 200,
          sessionFee: 50,
          paymentThreshold: 4,
          teacherId: teacher.id,
          isActive: true
        }
      })
      console.log(`Created test group: ${group.name}`)
    } else {
      console.log(`Using existing group: ${group.name}`)
    }

    // Add student to the group
    await prisma.groupStudent.create({
      data: {
        studentId: student.id,
        groupId: group.id,
        teacherId: teacher.id,
        isActive: true
      }
    })

    console.log(`Added student to group: ${group.name}`)

    // Create some test sessions
    const sessions = []
    const now = new Date()
    
    for (let i = 0; i < 5; i++) {
      const sessionDate = new Date(now)
      sessionDate.setDate(now.getDate() - (i * 7)) // Weekly sessions going back
      
      const session = await prisma.session.create({
        data: {
          groupId: group.id,
          teacherId: teacher.id,
          date: sessionDate,
          duration: group.scheduleDuration || 120,
          status: i === 0 ? 'SCHEDULED' : 'COMPLETED',
          title: `Session ${i + 1} - Mathématiques`,
          description: `Session de mathématiques - Chapitre ${i + 1}`,
          objectives: [
            `Objectif ${i + 1}.1`,
            `Objectif ${i + 1}.2`
          ],
          materials: [
            'Calculatrice',
            'Cahier d\'exercices'
          ],
          homework: i < 4 ? `Exercices page ${20 + i * 5} à ${25 + i * 5}` : null
        }
      })
      
      sessions.push(session)
      
      // Create attendance for completed sessions
      if (session.status === 'COMPLETED') {
        await prisma.attendance.create({
          data: {
            studentId: student.id,
            sessionId: session.id,
            teacherId: teacher.id,
            status: 'PRESENT',
            notes: 'Participation active'
          }
        })
      }
    }

    console.log(`Created ${sessions.length} test sessions with attendance`)

    // Create a test payment
    await prisma.payment.create({
      data: {
        studentId: student.id,
        groupId: group.id,
        teacherId: teacher.id,
        amount: group.monthlyFee || 200,
        type: 'MONTHLY_FEE',
        status: 'PAID',
        dueDate: new Date(),
        paidDate: new Date(),
        notes: 'Paiement mensuel - Test'
      }
    })

    console.log('Created test payment')

    console.log('\n✅ Test student account created successfully!')
    console.log('\n📋 Student Login Credentials:')
    console.log('Email: marie.dupont@student.com')
    console.log('Password: student123')
    console.log('\n🔗 Student Portal: http://localhost:3000/student/login')
    
  } catch (error) {
    console.error('Error creating test student:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  createTestStudent()
}

export { createTestStudent }