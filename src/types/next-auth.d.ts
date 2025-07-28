import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'
import { UserRole, UserStatus } from '@prisma/client'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      userId: string
      role: UserRole
      status: UserStatus
      firstName: string
      lastName: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    role: UserRole
    status: UserStatus
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    role: UserRole
    status: UserStatus
    userId: string
    firstName: string
    lastName: string
  }
}