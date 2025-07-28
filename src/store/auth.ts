import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Teacher {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  phone?: string
  address?: string
  bio?: string
  specialties?: string[]
  hourlyRate?: number
  status: 'pending' | 'approved' | 'rejected'
  subjects: string[]
  experience: number
  createdAt: Date
}

interface AuthState {
  teacher: Teacher | null
  isAuthenticated: boolean
  setTeacher: (teacher: Teacher | null) => void
  logout: () => void
  updateProfile: (data: Partial<Teacher>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      teacher: null,
      isAuthenticated: false,
      setTeacher: (teacher) => set({ teacher, isAuthenticated: !!teacher }),
      logout: () => set({ teacher: null, isAuthenticated: false }),
      updateProfile: (data) => {
        const { teacher } = get()
        if (teacher) {
          const updatedTeacher = { ...teacher, ...data }
          set({ teacher: updatedTeacher })
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    }
  )
);