import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/firebase-admin'
import { verifyRole } from '@/lib/auth-verification'

export const dynamic = 'force-dynamic'

// PUT - Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fullName, role, departmentId, phone, studentId, isActive, email } = body

    // Get the user to update
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent editing the last principal
    if (existingUser.role === 'PRINCIPAL' && role && role !== 'PRINCIPAL') {
      const principalCount = await prisma.user.count({
        where: { role: 'PRINCIPAL', isActive: true }
      })
      if (principalCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot change role of the last principal' },
          { status: 400 }
        )
      }
    }

    // Update user data
    const updateData: any = {}
    if (fullName !== undefined) updateData.fullName = fullName
    if (role !== undefined) updateData.role = role
    if (departmentId !== undefined) updateData.departmentId = departmentId || null
    if (phone !== undefined) updateData.phone = phone
    if (studentId !== undefined) updateData.studentId = studentId || null
    if (isActive !== undefined) updateData.isActive = isActive

    // Update in Firebase if email or display name changed
    if (email || fullName) {
      const firebaseUpdateData: any = {}
      if (email) firebaseUpdateData.email = email
      if (fullName) firebaseUpdateData.displayName = fullName
      
      try {
        await auth.updateUser(existingUser.firebaseUid, firebaseUpdateData)
      } catch (error: any) {
        console.error('Firebase update error:', error)
        // Continue with database update even if Firebase fails
      }
    }

    // Update in database
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      include: {
        department: { select: { name: true, id: true } }
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to update user' },
      { status: 500 }
    )
  }
}

// DELETE - Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await verifyRole(request, ['PRINCIPAL'])
    if (!authResult) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user to delete
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting the last principal
    if (existingUser.role === 'PRINCIPAL') {
      const principalCount = await prisma.user.count({
        where: { role: 'PRINCIPAL', isActive: true }
      })
      if (principalCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last principal' },
          { status: 400 }
        )
      }
    }

    // Delete from Firebase
    try {
      await auth.deleteUser(existingUser.firebaseUid)
    } catch (error: any) {
      console.error('Firebase delete error:', error)
      // Continue with database deletion even if Firebase fails
    }

    // Delete from database
    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    )
  }
}
