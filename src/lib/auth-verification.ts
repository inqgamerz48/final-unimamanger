import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase-admin'

/**
 * Verifies Firebase ID token from Authorization header
 * Returns the decoded token with user UID or null if invalid
 */
export async function verifyAuthToken(request: NextRequest): Promise<{ uid: string; decodedToken: any } | null> {
  try {
    // Get token from Authorization header (Bearer token)
    let token = ''
    const authHeader = request.headers.get('Authorization')

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split('Bearer ')[1]
    } else {
      // Fallback: Try getting token from cookie
      const cookieToken = request.cookies.get('firebase-token')?.value
      if (cookieToken) {
        token = cookieToken
      }
    }

    if (!token) {
      console.error('No token found in Authorization header or cookies')
      return null
    }

    // Verify token with Firebase Admin
    const decodedToken = await auth.verifyIdToken(token)

    if (!decodedToken.uid) {
      console.error('Token verified but no UID found')
      return null
    }

    return { uid: decodedToken.uid, decodedToken }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Helper to verify user role from database
 * Returns user object or null if not found/unauthorized
 */
export async function verifyRole(
  request: NextRequest,
  allowedRoles: string[]
): Promise<{ user: any; prismaUser: any } | null> {
  const authResult = await verifyAuthToken(request)

  if (!authResult) {
    return null
  }

  const { uid } = authResult

  // Import prisma here to avoid circular dependencies
  const { prisma } = await import('@/lib/prisma')

  const prismaUser = await prisma.user.findUnique({
    where: { firebaseUid: uid },
    include: { department: true }
  })

  if (!prismaUser) {
    console.error('User not found in database:', uid)
    return null
  }

  if (!allowedRoles.includes(prismaUser.role)) {
    console.error('User role not allowed:', prismaUser.role, 'Required:', allowedRoles)
    return null
  }

  return { user: authResult.decodedToken, prismaUser }
}
