import { create } from 'zustand'
import { generateId } from '@/lib/utils'

export interface Student {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  parentName: string
  parentPhone: string
  groupIds: string[]
  attendanceRate: number
  avatar?: string
  level?: string
  enrollmentDate: Date
  createdAt: Date
}

export interface Group {
  id: string
  name: string
  subject: string
  description: string
  studentIds: string[]
  monthlyLessonCount: number
  pricePerLesson: number
  pricePerSession: number
  color: string
  teacherId: string
  level?: string
  schedule?: {
    day: string
    time: string
    duration: number
  }
  location?: string
  createdAt: Date
}

export interface Lesson {
  id: string
  groupId: string
  title: string
  description: string
  date: Date
  startTime?: string
  endTime?: string
  duration: number // in minutes
  status: 'scheduled' | 'completed' | 'cancelled' | 'confirmed' | 'pending'
  attendeeIds: string[]
  attendance?: Array<{
    studentId: string
    present: boolean
    notes?: string
  }>
  location?: string
  notes?: string
  teacherId: string
  createdAt: Date
}

interface DataState {
  students: Student[]
  groups: Group[]
  lessons: Lesson[]
  addStudent: (student: Omit<Student, 'id' | 'createdAt'>) => void
  updateStudent: (id: string, data: Partial<Student>) => void
  deleteStudent: (id: string) => void
  addGroup: (group: Omit<Group, 'id' | 'createdAt'>) => void
  updateGroup: (id: string, data: Partial<Group>) => void
  deleteGroup: (id: string) => void
  addLesson: (lesson: Omit<Lesson, 'id' | 'createdAt'>) => void
  updateLesson: (id: string, data: Partial<Lesson>) => void
  deleteLesson: (id: string) => void
  markAttendance: (lessonId: string, studentId: string, present: boolean) => void
}

// Mock data
const mockStudents: Student[] = [
  {
    id: '1',
    firstName: 'Youssef',
    lastName: 'Ben Salem',
    email: 'youssef@example.com',
    phone: '+216 20 123 456',
    parentName: 'Mohamed Ben Salem',
    parentPhone: '+216 98 765 432',
    groupIds: ['1', '2'],
    attendanceRate: 95,
    level: 'Baccalauréat',
    enrollmentDate: new Date('2023-09-01'),
    createdAt: new Date('2023-09-01'),
  },
  {
    id: '2',
    firstName: 'Amira',
    lastName: 'Khelifi',
    email: 'amira@example.com',
    phone: '+216 25 987 654',
    parentName: 'Salma Khelifi',
    parentPhone: '+216 97 123 789',
    groupIds: ['1'],
    attendanceRate: 88,
    level: 'Baccalauréat',
    enrollmentDate: new Date('2023-09-15'),
    createdAt: new Date('2023-09-15'),
  },
  {
    id: '3',
    firstName: 'Karim',
    lastName: 'Bouazizi',
    email: 'karim@example.com',
    phone: '+216 22 456 789',
    parentName: 'Nadia Bouazizi',
    parentPhone: '+216 99 456 123',
    groupIds: ['2'],
    attendanceRate: 92,
    level: 'Avancé',
    enrollmentDate: new Date('2023-10-01'),
    createdAt: new Date('2023-10-01'),
  },
  {
    id: '4',
    firstName: 'Fatma',
    lastName: 'Trabelsi',
    email: 'fatma@example.com',
    phone: '+216 26 789 123',
    parentName: 'Leila Trabelsi',
    parentPhone: '+216 95 321 654',
    groupIds: ['1'],
    attendanceRate: 90,
    level: 'Baccalauréat',
    enrollmentDate: new Date('2023-09-10'),
    createdAt: new Date('2023-09-10'),
  },
  {
    id: '5',
    firstName: 'Omar',
    lastName: 'Mansouri',
    email: 'omar@example.com',
    phone: '+216 23 654 987',
    parentName: 'Sonia Mansouri',
    parentPhone: '+216 96 987 321',
    groupIds: ['2'],
    attendanceRate: 87,
    level: 'Avancé',
    enrollmentDate: new Date('2023-10-05'),
    createdAt: new Date('2023-10-05'),
  },
  {
    id: '6',
    firstName: 'Ines',
    lastName: 'Gharbi',
    email: 'ines@example.com',
    phone: '+216 24 321 789',
    parentName: 'Mounir Gharbi',
    parentPhone: '+216 97 654 987',
    groupIds: ['1'],
    attendanceRate: 93,
    level: 'Baccalauréat',
    enrollmentDate: new Date('2023-09-20'),
    createdAt: new Date('2023-09-20'),
  },
]

const mockGroups: Group[] = [
  {
    id: '1',
    name: 'Mathématiques Niveau Bac',
    subject: 'Mathématiques',
    description: 'Préparation au baccalauréat en mathématiques',
    studentIds: ['1', '2', '4', '6'],
    monthlyLessonCount: 8,
    pricePerLesson: 25,
    pricePerSession: 25,
    color: '#6366f1',
    teacherId: '1',
    level: 'Baccalauréat',
    schedule: {
      day: 'Lundi',
      time: '14:00',
      duration: 90
    },
    location: 'Salle A1',
    createdAt: new Date('2023-08-15'),
  },
  {
    id: '2',
    name: 'Physique Avancée',
    subject: 'Physique',
    description: 'Cours de physique pour étudiants avancés',
    studentIds: ['1', '3', '5'],
    monthlyLessonCount: 6,
    pricePerLesson: 30,
    pricePerSession: 30,
    color: '#ec4899',
    teacherId: '1',
    level: 'Avancé',
    schedule: {
      day: 'Mercredi',
      time: '16:00',
      duration: 120
    },
    location: 'Laboratoire B2',
    createdAt: new Date('2023-08-20'),
  },
]

const mockLessons: Lesson[] = [
  {
    id: '1',
    groupId: '1',
    title: 'Fonctions et dérivées',
    description: 'Introduction aux fonctions dérivées et leurs applications',
    date: new Date('2024-01-15T14:00:00'),
    startTime: '14:00',
    endTime: '15:30',
    duration: 90,
    status: 'completed',
    attendeeIds: ['1', '2', '4', '6'],
    location: 'Salle A1',
    notes: 'Excellent progrès de tous les étudiants',
    teacherId: '1',
    createdAt: new Date('2024-01-10'),
  },
  {
    id: '2',
    groupId: '2',
    title: 'Mécanique quantique',
    description: 'Principes de base de la mécanique quantique',
    date: new Date('2024-01-20T16:00:00'),
    startTime: '16:00',
    endTime: '18:00',
    duration: 120,
    status: 'scheduled',
    attendeeIds: ['1', '3', '5'],
    location: 'Laboratoire B2',
    teacherId: '1',
    createdAt: new Date('2024-01-15'),
  },
  // Today's lessons for testing presence functionality
  {
    id: '3',
    groupId: '1',
    title: 'Mathématiques - Intégrales',
    description: 'Calcul intégral et applications pratiques',
    date: new Date(),
    startTime: '09:00',
    endTime: '10:30',
    duration: 90,
    status: 'confirmed',
    attendeeIds: ['1', '2', '4', '6'],
    location: 'Salle A1',
    teacherId: '1',
    createdAt: new Date(),
  },
  {
    id: '4',
    groupId: '2',
    title: 'Physique - Électromagnétisme',
    description: 'Champs électriques et magnétiques',
    date: new Date(),
    startTime: '14:30',
    endTime: '16:30',
    duration: 120,
    status: 'confirmed',
    attendeeIds: ['1', '3', '5'],
    location: 'Laboratoire B2',
    teacherId: '1',
    createdAt: new Date(),
  },
  {
    id: '5',
    groupId: '1',
    title: 'Mathématiques - Révisions',
    description: 'Révision générale des chapitres précédents',
    date: new Date(),
    startTime: '16:00',
    endTime: '17:30',
    duration: 90,
    status: 'scheduled',
    attendeeIds: ['1', '2', '4', '6'],
    location: 'Salle A1',
    teacherId: '1',
    createdAt: new Date(),
  },
]

export const useDataStore = create<DataState>((set, get) => ({
  students: mockStudents,
  groups: mockGroups,
  lessons: mockLessons,

  addStudent: (studentData) => {
    const newStudent: Student = {
      ...studentData,
      id: generateId(),
      createdAt: new Date(),
    }
    set((state) => ({ students: [...state.students, newStudent] }))
  },

  updateStudent: (id, data) => {
    set((state) => ({
      students: state.students.map((student) =>
        student.id === id ? { ...student, ...data } : student
      ),
    }))
  },

  deleteStudent: (id) => {
    set((state) => ({
      students: state.students.filter((student) => student.id !== id),
    }))
  },

  addGroup: (groupData) => {
    const newGroup: Group = {
      ...groupData,
      id: generateId(),
      createdAt: new Date(),
    }
    set((state) => ({ groups: [...state.groups, newGroup] }))
  },

  updateGroup: (id, data) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === id ? { ...group, ...data } : group
      ),
    }))
  },

  deleteGroup: (id) => {
    set((state) => ({
      groups: state.groups.filter((group) => group.id !== id),
    }))
  },

  addLesson: (lessonData) => {
    const newLesson: Lesson = {
      ...lessonData,
      id: generateId(),
      createdAt: new Date(),
    }
    set((state) => ({ lessons: [...state.lessons, newLesson] }))
  },

  updateLesson: (id, data) => {
    set((state) => ({
      lessons: state.lessons.map((lesson) =>
        lesson.id === id ? { ...lesson, ...data } : lesson
      ),
    }))
  },

  deleteLesson: (id) => {
    set((state) => ({
      lessons: state.lessons.filter((lesson) => lesson.id !== id),
    }))
  },

  markAttendance: (lessonId, studentId, present) => {
    set((state) => ({
      lessons: state.lessons.map((lesson) => {
        if (lesson.id === lessonId) {
          const attendeeIds = present
            ? [...new Set([...lesson.attendeeIds, studentId])]
            : lesson.attendeeIds.filter((id) => id !== studentId)
          return { ...lesson, attendeeIds }
        }
        return lesson
      }),
    }))
  },
}))