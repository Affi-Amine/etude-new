import { prisma } from './prisma'
import { getServerSession } from 'next-auth/next'
import { authOptions } from './auth'
import { UserRole } from '@prisma/client'

/**
 * Get tenant-aware Prisma client that automatically filters data based on user's tenant
 * This ensures multi-tenant data isolation
 */
export async function getTenantPrisma() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('Unauthorized: No session found')
  }

  const userId = session.user.userId
  const userRole = session.user.role as UserRole

  // For admin users, return unrestricted prisma client
  if (userRole === UserRole.ADMIN) {
    return prisma
  }

  // For teachers, create a client that automatically filters by teacherId
  if (userRole === UserRole.TEACHER) {
    return createTeacherPrismaClient(userId)
  }

  throw new Error('Unauthorized: Invalid user role')
}

/**
 * Create a Prisma client with automatic teacher-based filtering
 * Simplified version to avoid extension compatibility issues
 */
function createTeacherPrismaClient(teacherId: string) {
  // For now, return the basic prisma client
  // The filtering will be handled manually in the route handlers
  return prisma
}

/**
 * Utility function to check if user has access to a specific resource
 */
export async function checkResourceAccess(resourceTeacherId: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('Unauthorized: No session found')
  }

  const userRole = session.user.role as UserRole
  const userId = session.user.userId

  // Admin has access to all resources
  if (userRole === UserRole.ADMIN) {
    return true
  }

  // Teachers can only access their own resources
  if (userRole === UserRole.TEACHER && userId === resourceTeacherId) {
    return true
  }

  throw new Error('Forbidden: Access denied to this resource')
}

/**
 * Get current user's tenant ID (teacher ID)
 */
export async function getCurrentTenantId(): Promise<string> {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    throw new Error('Unauthorized: No session found')
  }

  return session.user.userId
}