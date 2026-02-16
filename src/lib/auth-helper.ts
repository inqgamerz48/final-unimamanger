import { NextRequest } from 'next/server'
import { auth as adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'

export async function getAuthenticatedUser(request: NextRequest) {
    let firebaseUid = request.headers.get('x-firebase-uid')

    // Support Authorization: Bearer token pattern
    if (!firebaseUid) {
        const authHeader = request.headers.get('Authorization')
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            try {
                const decodedToken = await adminAuth.verifyIdToken(token)
                firebaseUid = decodedToken.uid
            } catch (error) {
                console.error('Bearer token verification failed:', error)
            }
        }
    }

    // Fallback to cookie-based auth
    if (!firebaseUid) {
        const token = request.cookies.get('firebase-token')?.value
        if (token) {
            try {
                const decodedToken = await adminAuth.verifyIdToken(token)
                firebaseUid = decodedToken.uid
            } catch (error) {
                console.error('Cookie token verification failed:', error)
            }
        }
    }

    if (!firebaseUid) return null

    return prisma.user.findUnique({
        where: { firebaseUid }
    })
}
