import { Group as PrismaGroup, Student as PrismaStudent, User as PrismaUser } from '@prisma/client'
import { Group, Student, User } from './types'

// Transform Prisma Group to frontend Group type
export function transformGroup(prismaGroup: PrismaGroup & {
  teacher?: PrismaUser;
  students?: Array<{
    id: string;
    studentId: string;
    isActive: boolean;
    student: PrismaStudent;
  }>;
  _count?: {
    students: number;
    sessions: number;
    payments: number;
  };
}): Group {
  return {
    id: prismaGroup.id,
    teacherId: prismaGroup.teacherId,
    name: prismaGroup.name,
    subject: prismaGroup.subject,
    isActive: prismaGroup.isActive,
    createdAt: prismaGroup.createdAt,
    updatedAt: prismaGroup.updatedAt,
    scheduleDay: prismaGroup.scheduleDay,
    scheduleTime: prismaGroup.scheduleTime,
    scheduleDuration: prismaGroup.scheduleDuration,
    monthlyFee: prismaGroup.monthlyFee,
    sessionFee: prismaGroup.sessionFee,
    registrationFee: prismaGroup.registrationFee,
    paymentDeadline: prismaGroup.paymentDeadline,
    // Legacy compatibility
    schedule: {
      day: prismaGroup.scheduleDay,
      time: prismaGroup.scheduleTime,
      duration: prismaGroup.scheduleDuration,
    },
    paymentConfig: {
      monthlyFee: prismaGroup.monthlyFee,
      sessionFee: prismaGroup.sessionFee,
      registrationFee: prismaGroup.registrationFee,
      paymentDeadline: prismaGroup.paymentDeadline,
    },
    studentIds: prismaGroup.students?.filter(s => s.isActive).map(s => s.studentId) || [],
    studentsCount: prismaGroup._count?.students || prismaGroup.students?.filter(s => s.isActive).length || 0,
    teacher: prismaGroup.teacher ? transformUser(prismaGroup.teacher) : undefined,
    students: prismaGroup.students?.map(gs => ({
      id: gs.id,
      groupId: prismaGroup.id,
      studentId: gs.studentId,
      joinedAt: new Date(), // This would come from GroupStudent model
      isActive: gs.isActive,
      student: transformStudent(gs.student),
    })),
  }
}

// Transform Prisma Student to frontend Student type
export function transformStudent(prismaStudent: PrismaStudent): Student {
  return {
    id: prismaStudent.id,
    name: prismaStudent.name,
    email: prismaStudent.email,
    phone: prismaStudent.phone,
    niveau: prismaStudent.niveau,
    section: prismaStudent.section,
    lycee: prismaStudent.lycee,
    isActive: prismaStudent.isActive,
    createdAt: prismaStudent.createdAt,
    updatedAt: prismaStudent.updatedAt,
  }
}

// Transform Prisma User to frontend User type
export function transformUser(prismaUser: PrismaUser): User {
  return {
    id: prismaUser.id,
    name: prismaUser.name,
    email: prismaUser.email,
    role: prismaUser.role as 'TEACHER' | 'ADMIN',
    isActive: prismaUser.isActive,
    createdAt: prismaUser.createdAt,
    updatedAt: prismaUser.updatedAt,
  }
}

// Transform frontend GroupFormData to Prisma create input
export function transformGroupFormData(formData: any, teacherId: string) {
  return {
    name: formData.name,
    subject: formData.subject,
    teacherId,
    scheduleDay: formData.schedule.day,
    scheduleTime: formData.schedule.time,
    scheduleDuration: formData.schedule.duration,
    monthlyFee: formData.paymentConfig.monthlyFee,
    sessionFee: formData.paymentConfig.sessionFee,
    registrationFee: formData.paymentConfig.registrationFee,
    paymentDeadline: formData.paymentConfig.paymentDeadline,
  }
}

// Transform frontend StudentFormData to Prisma create input
export function transformStudentFormData(formData: any) {
  return {
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    classe: formData.classe,
    lycee: formData.lycee,
  }
}