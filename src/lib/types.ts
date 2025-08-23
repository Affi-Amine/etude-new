// Core data models for the lesson management platform

// Prisma-compatible types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'TEACHER' | 'ADMIN';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupStudent {
  id: string;
  groupId: string;
  studentId: string;
  joinedAt: Date;
  leftAt?: Date;
  isActive: boolean;
  // Relations
  group?: Group;
  student?: Student;
}

export interface Attendance {
  id: string;
  sessionId: string;
  studentId: string;
  present: boolean;
  notes?: string;
  createdAt: Date;
  // Relations
  session?: Session;
  student?: Student;
}

export interface Payment {
  id: string;
  studentId: string;
  groupId: string;
  amount: number;
  type: 'MONTHLY' | 'SESSION' | 'REGISTRATION';
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  dueDate: Date;
  paidAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  // Relations
  student?: Student;
  group?: Group;
}

// Legacy interface for backward compatibility
export interface Teacher {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'approved';
  createdAt: Date;
}

export interface Student {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone: string;
  niveau: string;
  section: string;
  lycee: string;
  enrollmentDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  // Relations (optional for API responses)
  groups?: GroupStudent[];
  attendance?: Attendance[];
  payments?: Payment[];
}

export interface Group {
  id: string;
  teacherId: string;
  name: string;
  subject: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  // New schedule system for multiple weekly sessions
  weeklySchedule?: WeeklySession[];
  // Payment configuration
  sessionFee: number;
  paymentThreshold: number; // Number of sessions before payment is due
  registrationFee?: number;
  // Semester configuration
  semesterStartDate?: Date;
  semesterEndDate?: Date;
  // Legacy fields for backward compatibility
  scheduleDay?: string;
  scheduleTime?: string;
  scheduleDuration?: number;
  monthlyFee?: number;
  paymentDeadline?: number;
  schedule?: {
    day: string;
    time: string;
    duration: number;
  };
  paymentConfig?: {
    monthlyFee: number;
    sessionFee?: number;
    registrationFee?: number;
    paymentDeadline: number;
    countAbsentSessions?: boolean;
  };
  studentIds?: string[];
  studentsCount?: number;
  // Relations (optional for API responses)
  teacher?: User;
  students?: GroupStudent[];
  sessions?: Session[];
  payments?: Payment[];
  stats?: {
    totalStudents: number;
    attendanceRate: number;
    studentsNeedingPayment: number;
    totalRevenue: number;
  };
}

export interface WeeklySession {
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';
  startTime: string; // Format: "HH:mm"
  duration: number; // Duration in minutes
}

export interface NewGroupFormData {
  name: string;
  subject: string;
  weeklySchedule: WeeklySession[];
  sessionFee: number;
  paymentThreshold: number;
  registrationFee?: number;
  semesterStartDate: Date;
  semesterEndDate: Date;
  studentIds: string[];
}

export interface Session {
  id: string;
  groupId: string;
  date: Date;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  // Course content fields
  title?: string;
  description?: string;
  objectives?: string[];
  materials?: string[];
  homework?: string;
  resources?: {
    type: 'file' | 'link' | 'document';
    name: string;
    url: string;
    size?: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
  // Relations
  group?: Group;
  attendance?: Attendance[];
  // UI helpers
  attendees?: {
    studentId: string;
    present: boolean;
    isGuestFromGroup?: string;
  }[];
}

export interface PaymentRecord {
  id: string;
  studentId: string;
  groupId: string;
  amount: number;
  sessionsIncluded: number;
  paymentDate: Date;
  cycleStartDate: Date;
  cycleEndDate: Date;
  method: 'cash' | 'bank_transfer' | 'other';
  notes?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId: string;
  groupId: string;
  date: Date;
  present: boolean;
  isGuestSession: boolean;
  notes?: string;
}

export interface StudentPaymentStatus {
  studentId: string;
  groupId: string;
  currentCycleSessions: number;
  attendedSessions: number;
  paymentDue: boolean;
  overflowSessions: number;
  lastPaymentDate?: Date;
  nextPaymentAmount: number;
  amount?: number;
  dueDate?: Date;
  status: 'paid' | 'approaching' | 'due' | 'overdue';
  statusMessage: string;
}

export interface NotificationPreference {
  id: string;
  teacherId: string;
  emailNotifications: boolean;
  paymentReminders: boolean;
  attendanceAlerts: boolean;
  reminderIntervals: number[]; // hours before session
}

export interface DashboardStats {
  totalStudents: number;
  totalGroups: number;
  totalEarningsThisMonth: number;
  pendingPayments: number;
  upcomingSessions: number;
  averageAttendanceRate: number;
}

// Form interfaces
export interface GroupFormData {
  name: string;
  subject: string;
  schedule: {
    day: string;
    time: string;
    duration: number;
  };
  paymentConfig: {
    monthlyFee: number;
    sessionFee?: number;
    registrationFee?: number;
    paymentDeadline: number;
    countAbsentSessions?: boolean;
  };
  studentIds: string[];
}

export interface StudentFormData {
  name: string;
  email: string;
  phone?: string;
  primaryGroupId: string;
}

// UI State interfaces
export interface GroupViewMode {
  view: 'grid' | 'list';
  sortBy: 'name' | 'subject' | 'students' | 'created';
  sortOrder: 'asc' | 'desc';
  filterBy: {
    subject?: string;
    paymentStatus?: 'all' | 'pending' | 'paid';
    isActive?: boolean;
  };
}

export interface AttendanceSession {
  sessionId: string;
  groupId: string;
  date: Date;
  students: {
    id: string;
    name: string;
    present: boolean;
    isGuest: boolean;
    guestFromGroup?: string;
  }[];
}