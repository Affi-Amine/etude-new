import { Teacher, Student, Group, Session, PaymentRecord, AttendanceRecord } from './types';

// Mock Teachers
export const mockTeachers: Teacher[] = [
  {
    id: 'teacher1',
    name: 'Prof. Ahmed Mansouri',
    email: 'ahmed.mansouri@example.com',
    status: 'approved',
    createdAt: new Date('2024-01-15')
  }
];

// Mock Students
export const mockStudents: Student[] = [
  {
    id: 'student-1',
    name: 'Ahmed Ben Ali',
    phone: '+216 20 123 456',
    classe: 'Terminale',
    lycee: 'Lycée Pilote de Tunis',
    isActive: true,
    createdAt: new Date('2024-01-15')
  },
  {
    id: 'student-2',
    name: 'Fatma Trabelsi',
    phone: '+216 22 234 567',
    classe: '1ère Année',
    lycee: 'Lycée Bourguiba',
    isActive: true,
    createdAt: new Date('2024-01-20')
  },
  {
    id: 'student-3',
    name: 'Mohamed Karray',
    phone: '+216 25 345 678',
    classe: '2ème Année',
    lycee: 'Lycée Ibn Khaldoun',
    isActive: true,
    createdAt: new Date('2024-02-01')
  },
  {
    id: 'student-4',
    name: 'Leila Mansouri',
    phone: '+216 27 456 789',
    classe: 'Terminale',
    lycee: 'Lycée Pilote de Sfax',
    isActive: true,
    createdAt: new Date('2024-02-10')
  },
  {
    id: 'student-5',
    name: 'Youssef Gharbi',
    phone: '+216 29 567 890',
    classe: '1ère Année',
    lycee: 'Lycée Technique',
    isActive: true,
    createdAt: new Date('2024-02-15')
  },
  {
    id: 'student-6',
    name: 'Nour Belhaj',
    phone: '+216 21 678 901',
    classe: '2ème Année',
    lycee: 'Lycée Moderne',
    isActive: true,
    createdAt: new Date('2024-02-20')
  }
];

// Mock Groups
export const mockGroups: Group[] = [
  {
    id: 'group1',
    teacherId: 'teacher1',
    name: 'Mathématiques Avancées',
    subject: 'Mathématiques',
    scheduleDay: 'Lundi',
    scheduleTime: '17:00',
    scheduleDuration: 90,
    monthlyFee: 80,
    sessionFee: 10,
    paymentDeadline: 30,
    schedule: {
      day: 'Lundi',
      time: '17:00',
      duration: 90
    },
    paymentConfig: {
      monthlyFee: 80,
      sessionFee: 10,
      paymentDeadline: 30,
      countAbsentSessions: false
    },
    studentIds: ['student-1', 'student-2', 'student-3'],
    createdAt: new Date('2024-01-15'),
    isActive: true
  },
  {
    id: 'group2',
    teacherId: 'teacher1',
    name: 'Physique Terminale',
    subject: 'Physique',
    scheduleDay: 'Mercredi',
    scheduleTime: '15:30',
    scheduleDuration: 120,
    monthlyFee: 90,
    sessionFee: 15,
    paymentDeadline: 30,
    schedule: {
      day: 'Mercredi',
      time: '15:30',
      duration: 120
    },
    paymentConfig: {
      monthlyFee: 90,
      sessionFee: 15,
      paymentDeadline: 30,
      countAbsentSessions: false
    },
    studentIds: ['student-4', 'student-5'],
    createdAt: new Date('2024-01-20'),
    isActive: true
  },
  {
    id: 'group3',
    teacherId: 'teacher1',
    name: 'Chimie Organique',
    subject: 'Chimie',
    scheduleDay: 'Vendredi',
    scheduleTime: '16:00',
    scheduleDuration: 90,
    monthlyFee: 60,
    sessionFee: 15,
    paymentDeadline: 30,
    schedule: {
      day: 'Vendredi',
      time: '16:00',
      duration: 90
    },
    paymentConfig: {
      monthlyFee: 60,
      sessionFee: 15,
      paymentDeadline: 30,
      countAbsentSessions: false
    },
    studentIds: ['student-6'],
    createdAt: new Date('2024-02-01'),
    isActive: true
  }
];

// Mock Sessions (last 2 months)
export const mockSessions: Session[] = [
  // Group 1 sessions
  {
    id: 'session1',
    groupId: 'group1',
    date: new Date('2024-11-04'),
    attendees: [
      { studentId: 'student-1', present: true },
      { studentId: 'student-2', present: true },
      { studentId: 'student-3', present: false }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session2',
    groupId: 'group1',
    date: new Date('2024-11-11'),
    attendees: [
      { studentId: 'student-1', present: true },
      { studentId: 'student-2', present: false },
      { studentId: 'student-3', present: true }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session3',
    groupId: 'group1',
    date: new Date('2024-11-18'),
    attendees: [
      { studentId: 'student-1', present: true },
      { studentId: 'student-2', present: true },
      { studentId: 'student-3', present: true }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session4',
    groupId: 'group1',
    date: new Date('2024-11-25'),
    attendees: [
      { studentId: 'student-1', present: true },
      { studentId: 'student-2', present: true },
      { studentId: 'student-3', present: false }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session5',
    groupId: 'group1',
    date: new Date('2024-12-02'),
    attendees: [
      { studentId: 'student-1', present: true },
      { studentId: 'student-2', present: true },
      { studentId: 'student-3', present: true }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session6',
    groupId: 'group1',
    date: new Date('2024-12-09'),
    attendees: [
      { studentId: 'student-1', present: true },
      { studentId: 'student-2', present: false },
      { studentId: 'student-3', present: true }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session7',
    groupId: 'group1',
    date: new Date('2024-12-16'),
    attendees: [
      { studentId: 'student-1', present: true },
      { studentId: 'student-2', present: true },
      { studentId: 'student-3', present: true }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session8',
    groupId: 'group1',
    date: new Date('2024-12-23'),
    attendees: [
      { studentId: 'student-1', present: true },
      { studentId: 'student-2', present: true },
      { studentId: 'student-3', present: false }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  // Group 2 sessions
  {
    id: 'session9',
    groupId: 'group2',
    date: new Date('2024-11-06'),
    attendees: [
      { studentId: 'student-4', present: true },
      { studentId: 'student-5', present: true }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session10',
    groupId: 'group2',
    date: new Date('2024-11-13'),
    attendees: [
      { studentId: 'student-4', present: false },
      { studentId: 'student-5', present: true }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session11',
    groupId: 'group2',
    date: new Date('2024-11-20'),
    attendees: [
      { studentId: 'student-4', present: true },
      { studentId: 'student-5', present: true }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session12',
    groupId: 'group2',
    date: new Date('2024-11-27'),
    attendees: [
      { studentId: 'student-4', present: true },
      { studentId: 'student-5', present: false }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session13',
    groupId: 'group2',
    date: new Date('2024-12-04'),
    attendees: [
      { studentId: 'student-4', present: true },
      { studentId: 'student-5', present: true }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session14',
    groupId: 'group2',
    date: new Date('2024-12-11'),
    attendees: [
      { studentId: 'student-4', present: true },
      { studentId: 'student-5', present: true }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  // Group 3 sessions
  {
    id: 'session15',
    groupId: 'group3',
    date: new Date('2024-11-08'),
    attendees: [
      { studentId: 'student-6', present: true }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session16',
    groupId: 'group3',
    date: new Date('2024-11-15'),
    attendees: [
      { studentId: 'student-6', present: true }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session17',
    groupId: 'group3',
    date: new Date('2024-11-22'),
    attendees: [
      { studentId: 'student-6', present: false }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  {
    id: 'session18',
    groupId: 'group3',
    date: new Date('2024-11-29'),
    attendees: [
      { studentId: 'student-6', present: true }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'COMPLETED'
  },
  // Future sessions
  {
    id: 'session19',
    groupId: 'group1',
    date: new Date('2024-12-30'),
    attendees: [
      { studentId: 'student-1', present: false },
      { studentId: 'student-2', present: false },
      { studentId: 'student-3', present: false }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'SCHEDULED'
  },
  {
    id: 'session20',
    groupId: 'group2',
    date: new Date('2024-12-18'),
    attendees: [
      { studentId: 'student-4', present: false },
      { studentId: 'student-5', present: false }
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'SCHEDULED'
  }
];

// Mock Payment Records
export const mockPaymentRecords: PaymentRecord[] = [
  {
    id: 'payment1',
    studentId: 'student-1',
    groupId: 'group1',
    amount: 80,
    sessionsIncluded: 8,
    paymentDate: new Date('2024-10-15'),
    cycleStartDate: new Date('2024-10-01'),
    cycleEndDate: new Date('2024-11-30'),
    method: 'cash',
    notes: 'Payment for October-November cycle'
  },
  {
    id: 'payment2',
    studentId: 'student-4',
    groupId: 'group2',
    amount: 90,
    sessionsIncluded: 6,
    paymentDate: new Date('2024-10-20'),
    cycleStartDate: new Date('2024-10-01'),
    cycleEndDate: new Date('2024-11-30'),
    method: 'bank_transfer',
    notes: 'Payment for October-November cycle'
  }
];

// Helper functions for mock data
export function getStudentsByGroup(groupId: string): Student[] {
  const group = mockGroups.find(g => g.id === groupId);
  if (!group || !group.studentIds) return [];
  return mockStudents.filter(s => group.studentIds.includes(s.id));
}

export function getSessionsByGroup(groupId: string): Session[] {
  return mockSessions.filter(s => s.groupId === groupId);
}

export function getPaymentsByStudent(studentId: string): PaymentRecord[] {
  return mockPaymentRecords.filter(p => p.studentId === studentId);
}