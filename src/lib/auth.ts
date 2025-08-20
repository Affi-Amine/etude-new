import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { UserRole, UserStatus } from '@prisma/client'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        try {
          const { email, password } = loginSchema.parse(credentials)
          
          const user = await prisma.user.findUnique({
            where: { email },
            select: {
              id: true,
              email: true,
              name: true,
              firstName: true,
              lastName: true,
              password: true,
              role: true,
              status: true,
              // Add other fields you need from the User model
              // For example, if you have a 'createdAt' field:
              // createdAt: true,
            }
          })
          
          if (!user || user.status !== 'APPROVED') {
            return null
          }
          
          const isPasswordValid = await bcrypt.compare(password, user.password)
          
          if (!isPasswordValid) {
            return null
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            firstName: user.firstName || '', // Provide a default empty string if null
            lastName: user.lastName || '', // Provide a default empty string if null
            role: user.role,
            status: user.status,
          }
        } catch {
          return null
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.status = (user as any).status
        token.userId = user.id
        token.firstName = (user as any).firstName || ''
        token.lastName = (user as any).lastName || ''
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.userId = token.userId as string
        session.user.role = token.role as UserRole
        session.user.status = token.status as UserStatus
        session.user.firstName = token.firstName as string
        session.user.lastName = token.lastName as string
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/connexion',
  },
}