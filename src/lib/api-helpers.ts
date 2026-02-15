import { User as FirebaseUser } from 'firebase/auth'

/**
 * Helper function to get authentication headers with Firebase ID token
 * This ensures all API requests include a verified token, not just a UID
 */
export async function getAuthHeaders(firebaseUser: FirebaseUser | null): Promise<Record<string, string>> {
  const headers: Record<string, string> = { 
    'Content-Type': 'application/json'
  }
  
  if (firebaseUser) {
    try {
      // Get fresh ID token from Firebase
      const token = await firebaseUser.getIdToken()
      // Send token in Authorization header (Bearer format)
      headers['Authorization'] = `Bearer ${token}`
    } catch (error) {
      console.error('Error getting Firebase token:', error)
    }
  }
  
  return headers
}

/**
 * Wrapper for fetch API that automatically includes auth headers
 */
export async function authFetch(
  firebaseUser: FirebaseUser | null,
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const headers = await getAuthHeaders(firebaseUser)
  
  return fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...(options.headers || {}),
    },
  })
}
