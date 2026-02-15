import { NextRequest } from 'next/server'
import { auth as adminAuth } from '@/lib/firebase-admin'
import { prisma } from '@/lib/prisma'

export async function getAuthenticatedUser(request: NextRequest) {
    let firebaseUid = request.headers.get('x-firebase-uid')

    if (!firebaseUid) {
        const token = request.cookies.get('firebase-token')?.value
        if (token) {
            try {
                const decodedToken = await adminAuth.verifyIdToken(token)
                firebaseUid = decodedToken.uid
            } catch (error) {
                console.error('Token verification failed:', error)
            }
        }
    }

    if (!firebaseUid) return null

    return prisma.user.findUnique({
        where: { firebaseUid }
    })
}
