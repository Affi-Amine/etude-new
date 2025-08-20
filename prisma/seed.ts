import { PrismaClient, UserRole, UserStatus, PaymentStatus, PaymentType, AttendanceStatus, SessionStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clean up existing data


  console.log('🧹 Existing data cleaned up')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123456', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@lessonplatform.tn' },
    update: {},
    create: {
      email: 'admin@lessonplatform.tn',
      name: 'Platform Administrator',
      password: adminPassword,
      role: UserRole.ADMIN,
      status: UserStatus.APPROVED,
    },
  })
  console.log('✅ Admin user created:', admin.email)

  // Create sample teachers
  const teacher1Password = await bcrypt.hash('teacher123', 12)
  const teacher1 = await prisma.user.upsert({
    where: { email: 'ahmed.ben.salem@gmail.com' },
    update: {},
    create: {
      email: 'ahmed.ben.salem@gmail.com',
      name: 'Ahmed Ben Salem',
      password: teacher1Password,
      role: UserRole.TEACHER,
      status: UserStatus.APPROVED,
    },
  })

  const teacher2Password = await bcrypt.hash('teacher123', 12)
  const teacher2 = await prisma.user.upsert({
    where: { email: 'fatma.trabelsi@gmail.com' },
    update: {},
    create: {
      email: 'fatma.trabelsi@gmail.com',
      name: 'Fatma Trabelsi',
      password: teacher2Password,
      role: UserRole.TEACHER,
      status: UserStatus.APPROVED,
    },
  })

  console.log('✅ Teachers created:', teacher1.email, teacher2.email)

  // Create sample students
  const student1Password = await bcrypt.hash('student123', 12)
  const student1User = await prisma.user.create({
    data: {
      email: 'student1@example.com',
      name: 'Ahmed Khalil',
      password: student1Password,
      role: UserRole.STUDENT,
      status: UserStatus.APPROVED,
    },
  })

  const student1 = await prisma.student.create({
    data: {
      teacherId: teacher1.id,
      userId: student1User.id,
      name: 'Ahmed Khalil',
      email: 'student1@example.com',
      phone: '+216 20 123 456',
      classe: '4ème Sciences',
      lycee: 'Lycée Pilote de Tunis',
      level: 'Secondaire',
      familyCode: '123456',
      enrollmentDate: new Date('2024-09-01'),
    },
  })

  const student2Password = await bcrypt.hash('student123', 12)
  const student2User = await prisma.user.create({
    data: {
      email: 'student2@example.com',
      name: 'Fatma Ben Ali',
      password: student2Password,
      role: UserRole.STUDENT,
      status: UserStatus.APPROVED,
    },
  })

  const student2 = await prisma.student.create({
    data: {
      teacherId: teacher1.id,
      userId: student2User.id,
      name: 'Fatma Ben Ali',
      email: 'student2@example.com',
      phone: '+216 20 234 567',
      classe: '3ème Sciences',
      lycee: 'Lycée Bourguiba',
      level: 'Secondaire',
      familyCode: '234567',
      enrollmentDate: new Date('2024-09-01'),
    },
  })

  console.log('✅ Students created:', student1.email, student2.email)

  // Create sample groups
  const group1 = await prisma.group.create({
    data: {
      name: 'Mathématiques 4ème',
      subject: 'Mathématiques',
      teacherId: teacher1.id,
      scheduleDay: 'Lundi',
      scheduleTime: '14:00',
      scheduleDuration: 90,
      monthlyFee: 80.0,
      sessionFee: 20.0,
    },
  })

  const group2 = await prisma.group.create({
    data: {
      name: 'Physique 3ème',
      subject: 'Physique',
      teacherId: teacher1.id,
      scheduleDay: 'Mercredi',
      scheduleTime: '16:00',
      scheduleDuration: 90,
      monthlyFee: 75.0,
      sessionFee: 18.0,
    },
  })

  console.log('✅ Groups created:', group1.name, group2.name)

  // Add students to groups
  await prisma.groupStudent.createMany({
    data: [
      {
        groupId: group1.id,
        studentId: student1.id,
        teacherId: teacher1.id,
      },
      {
        groupId: group2.id,
        studentId: student2.id,
        teacherId: teacher1.id,
      },
    ],
  })

  console.log('✅ Students added to groups')

  // Create sample sessions
  const session1 = await prisma.session.create({
    data: {
      groupId: group1.id,
      teacherId: teacher1.id,
      date: new Date('2024-12-16T14:00:00'),
      duration: 90,
      status: SessionStatus.COMPLETED,
      title: 'Équations du second degré',
      description: 'Introduction aux équations du second degré et méthodes de résolution',
      objectives: ['Comprendre la forme générale', 'Maîtriser la résolution par factorisation'],
      materials: ['Manuel de mathématiques', 'Calculatrice'],
      homework: 'Exercices 1 à 10 page 45',
    },
  })

  const session2 = await prisma.session.create({
    data: {
      groupId: group2.id,
      teacherId: teacher1.id,
      date: new Date('2024-12-18T16:00:00'),
      duration: 90,
      status: SessionStatus.COMPLETED,
      title: 'Forces et mouvement',
      description: 'Étude des forces et leur effet sur le mouvement des objets',
      objectives: ['Identifier les types de forces', 'Appliquer les lois de Newton'],
      materials: ['Manuel de physique', 'Matériel d\'expérimentation'],
      homework: 'Préparer le TP sur les forces',
    },
  })

  // Create future sessions
  const futureSession1 = await prisma.session.create({
    data: {
      groupId: group1.id,
      teacherId: teacher1.id,
      date: new Date('2024-12-23T14:00:00'),
      duration: 90,
      status: SessionStatus.SCHEDULED,
      title: 'Fonctions polynomiales',
      description: 'Étude des fonctions polynomiales du second degré',
    },
  })

  const futureSession2 = await prisma.session.create({
    data: {
      groupId: group2.id,
      teacherId: teacher1.id,
      date: new Date('2024-12-25T16:00:00'),
      duration: 90,
      status: SessionStatus.SCHEDULED,
      title: 'Énergie cinétique et potentielle',
      description: 'Conservation de l\'énergie mécanique',
    },
  })

  console.log('✅ Sessions created')

  // Create attendance records
  await prisma.attendance.createMany({
    data: [
      {
        sessionId: session1.id,
        studentId: student1.id,
        teacherId: teacher1.id,
        status: AttendanceStatus.PRESENT,
        notes: 'Très participatif',
      },
      {
        sessionId: session2.id,
        studentId: student2.id,
        teacherId: teacher1.id,
        status: AttendanceStatus.PRESENT,
        notes: 'Bon travail',
      },
    ],
  })

  console.log('✅ Attendance records created')

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n🔐 Login credentials:')
  console.log('Admin: admin@lessonplatform.tn / admin123456')
  console.log('Teacher1: ahmed.ben.salem@gmail.com / teacher123')
  console.log('Teacher2: fatma.trabelsi@gmail.com / teacher123')

  console.log('Teacher2: fatma.trabelsi@gmail.com / teacher123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })