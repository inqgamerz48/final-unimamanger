import { initializeApp, cert, getApps, App } from 'firebase-admin/app'
import { getAuth, Auth } from 'firebase-admin/auth'

let _app: App
let _auth: Auth

function initAuth() {
  if (_auth) return _auth

  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!getApps().length) {
    if (!privateKey || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      throw new Error('Firebase Admin credentials not configured')
    }

    _app = initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    })
  } else {
    _app = getApps()[0]
  }

  _auth = getAuth(_app)
  return _auth
}

export const auth: Auth = {
  verifyIdToken: (token: string) => initAuth().verifyIdToken(token),
  getUser: (uid: string) => initAuth().getUser(uid),
  getUserByEmail: (email: string) => initAuth().getUserByEmail(email),
  createCustomToken: (uid: string, developerClaims?: object) => initAuth().createCustomToken(uid, developerClaims),
  listUsers: (maxResults?: number, pageToken?: string) => initAuth().listUsers(maxResults, pageToken),
  updateUser: (uid: string, properties: object) => initAuth().updateUser(uid, properties),
  deleteUser: (uid: string) => initAuth().deleteUser(uid),
} as unknown as Auth
