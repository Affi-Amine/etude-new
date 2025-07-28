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