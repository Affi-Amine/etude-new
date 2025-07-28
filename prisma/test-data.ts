const { PrismaClient, UserRole, UserStatus, PaymentStatus, PaymentType, AttendanceStatus, SessionStatus } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createTestData() {
  console.log('🌱 Creating test data...')

  // Get the teacher
  const teacher = await prisma.user.findFirst({
    where: { email: 'ahmed.ben.salem@gmail.com' }
  })

  if (!teacher) {
    console.error('Teacher not found')
    return
  }

  // Create students
  const student1 = await prisma.student.create({
    data: {
      teacherId: teacher.id,
      name: 'Nebras Hamdi',
      email: 'nebras.hamdi@email.com',
      phone: '+216 20 123 456',
      classe: 'Bac Science',
      lycee: 'Lycée Pilote Tunis'
    }
  })

  const student2 = await prisma.student.create({
    data: {
      teacherId: teacher.id,
      name: 'Amira Ben Ali',
      email: 'amira.benali@email.com',
      phone: '+216 25 789 012',
      classe: 'Bac Math',
      lycee: 'Lycée Bourguiba'
    }
  })

  const student3 = await prisma.student.create({
    data: {
      teacherId: teacher.id,
      name: 'Mohamed Trabelsi',
      email: 'mohamed.trabelsi@email.com',
      phone: '+216 98 345 678',
      classe: 'Bac Science',
      lycee: 'Lycée Ibn Khaldoun'
    }
  })

  // Create groups
  const group1 = await prisma.group.create({
    data: {
      name: 'Bac Science',
      subject: 'Mathématiques',
      teacherId: teacher.id,
      sessionFee: 25, // 25 DT par session
      paymentThreshold: 4, // Paiement tous les 4 sessions
      isActive: true,
      weeklySchedule: [
        {
          day: 'MONDAY',
          startTime: '14:00',
          endTime: '16:00',
          duration: 120
        }
      ]
    }
  })

  const group2 = await prisma.group.create({
    data: {
      name: 'Bac Math',
      subject: 'Physique',
      teacherId: teacher.id,
      sessionFee: 30, // 30 DT par session
      paymentThreshold: 4, // Paiement tous les 4 sessions
      isActive: true,
      weeklySchedule: [
        {
          day: 'WEDNESDAY',
          startTime: '16:00',
          endTime: '18:00',
          duration: 120
        }
      ]
    }
  })

  const group3 = await prisma.group.create({
    data: {
      name: 'Préparation Concours',
      subject: 'Sciences',
      teacherId: teacher.id,
      sessionFee: 35, // 35 DT par session
      paymentThreshold: 3, // Paiement tous les 3 sessions
      isActive: true,
      weeklySchedule: [
        {
          day: 'SATURDAY',
          startTime: '09:00',
          endTime: '12:00',
          duration: 180
        }
      ]
    }
  })

  // Add students to groups
  await prisma.groupStudent.createMany({
    data: [
      {
        groupId: group1.id,
        studentId: student1.id,
        teacherId: teacher.id,
        isActive: true
      },
      {
        groupId: group2.id,
        studentId: student2.id,
        teacherId: teacher.id,
        isActive: true
      },
      {
        groupId: group3.id,
        studentId: student3.id,
        teacherId: teacher.id,
        isActive: true
      }
    ]
  })

  // Create sessions for group1 (Nebras should have 2 sessions attended)
  const sessions1 = []
  for (let i = 0; i < 8; i++) {
    const sessionDate = new Date()
    sessionDate.setDate(sessionDate.getDate() - (7 * (8 - i))) // 8 weeks ago to now
    
    const session = await prisma.session.create({
      data: {
        groupId: group1.id,
        teacherId: teacher.id,
        date: sessionDate,
        duration: 120,
        status: SessionStatus.COMPLETED,
        notes: `Session ${i + 1} - Mathématiques`
      }
    })
    sessions1.push(session)
  }

  // Create attendance for Nebras (only 2 sessions attended out of 8)
  await prisma.attendance.createMany({
    data: [
      {
        sessionId: sessions1[0].id,
        studentId: student1.id,
        teacherId: teacher.id,
        status: AttendanceStatus.PRESENT
      },
      {
        sessionId: sessions1[1].id,
        studentId: student1.id,
        teacherId: teacher.id,
        status: AttendanceStatus.PRESENT
      },
      // Absent for the rest
      ...sessions1.slice(2).map(session => ({
        sessionId: session.id,
        studentId: student1.id,
        teacherId: teacher.id,
        status: AttendanceStatus.ABSENT
      }))
    ]
  })

  // Create sessions and attendance for other students
  const sessions2 = []
  for (let i = 0; i < 6; i++) {
    const sessionDate = new Date()
    sessionDate.setDate(sessionDate.getDate() - (7 * (6 - i)))
    
    const session = await prisma.session.create({
      data: {
        groupId: group2.id,
        teacherId: teacher.id,
        date: sessionDate,
        duration: 120,
        status: SessionStatus.COMPLETED,
        notes: `Session ${i + 1} - Physique`
      }
    })
    sessions2.push(session)
  }

  // Amira attends 5 out of 6 sessions
  await prisma.attendance.createMany({
    data: sessions2.slice(0, 5).map(session => ({
      sessionId: session.id,
      studentId: student2.id,
      teacherId: teacher.id,
      status: AttendanceStatus.PRESENT
    }))
  })

  const sessions3 = []
  for (let i = 0; i < 4; i++) {
    const sessionDate = new Date()
    sessionDate.setDate(sessionDate.getDate() - (7 * (4 - i)))
    
    const session = await prisma.session.create({
      data: {
        groupId: group3.id,
        teacherId: teacher.id,
        date: sessionDate,
        duration: 180,
        status: SessionStatus.COMPLETED,
        notes: `Session ${i + 1} - Sciences`
      }
    })
    sessions3.push(session)
  }

  // Mohamed attends all 4 sessions (should trigger payment)
  await prisma.attendance.createMany({
    data: sessions3.map(session => ({
      sessionId: session.id,
      studentId: student3.id,
      teacherId: teacher.id,
      status: AttendanceStatus.PRESENT
    }))
  })

  console.log('✅ Test data created successfully!')
  console.log('Groups created:', [group1.name, group2.name, group3.name])
  console.log('Students created:', [student1.name, student2.name, student3.name])
  console.log('Sessions created:', sessions1.length + sessions2.length + sessions3.length)
}

createTestData()
  .catch((e) => {
    console.error('❌ Error creating test data:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })