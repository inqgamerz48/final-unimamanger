'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Building2, 
  Bell, 
  Lock, 
  Camera,
  Save,
  Loader2
} from 'lucide-react'

export default function AdminSettings() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  
  // Profile state
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
  })
  
  // College settings state
  const [collegeData, setCollegeData] = useState({
    collegeName: '',
    collegeCode: '',
    address: '',
    phone: '',
    email: '',
    academicYear: '2024-2025',
  })
  
  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    notifications: true,
    emailAlerts: true,
    feeReminders: true,
  })
  
  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'PRINCIPAL') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'PRINCIPAL') {
      fetchSettings()
      fetchCollegeSettings()
    }
  }, [user])

  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' }
    if (firebaseUser?.uid) {
      headers['x-firebase-uid'] = firebaseUser.uid
    }
    return headers
  }

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setNotificationSettings({
          notifications: data.notifications,
          emailAlerts: data.emailAlerts,
          feeReminders: data.feeReminders,
        })
        setProfileData(prev => ({
          ...prev,
          bio: data.bio || '',
        }))
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const fetchCollegeSettings = async () => {
    try {
      const res = await fetch('/api/admin/college-settings', { headers: getAuthHeaders() })
      if (res.ok) {
        const data = await res.json()
        setCollegeData({
          collegeName: data.collegeName || '',
          collegeCode: data.collegeCode || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          academicYear: data.academicYear || '2024-2025',
        })
      }
    } catch (error) {
      console.error('Error fetching college settings:', error)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData),
      })
      
      if (res.ok) {
        alert('Profile updated successfully')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveCollege = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/college-settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(collegeData),
      })
      
      if (res.ok) {
        alert('College settings updated successfully')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update college settings')
      }
    } catch (error) {
      console.error('Error updating college settings:', error)
      alert('Failed to update college settings')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(notificationSettings),
      })
      
      if (res.ok) {
        alert('Notification settings updated successfully')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update notification settings')
      }
    } catch (error) {
      console.error('Error updating notification settings:', error)
      alert('Failed to update notification settings')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(passwordData),
      })
      
      if (res.ok) {
        alert('Password changed successfully')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to change password')
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  if (loading || user?.role !== 'PRINCIPAL') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/50 mt-1">Manage your profile and system settings</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-charcoal border-white/5">
            <TabsTrigger value="profile" className="data-[state=active]:bg-neon-lime data-[state=active]:text-obsidian">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="college" className="data-[state=active]:bg-neon-lime data-[state=active]:text-obsidian">
              <Building2 className="w-4 h-4 mr-2" />
              College
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-neon-lime data-[state=active]:text-obsidian">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-neon-lime data-[state=active]:text-obsidian">
              <Lock className="w-4 h-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-charcoal border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription className="text-white/50">
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="" />
                    <AvatarFallback className="bg-neon-lime text-obsidian text-2xl">
                      {user.fullName?.[0]?.toUpperCase() || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" className="border-white/10 text-white">
                      <Camera className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
                    <p className="text-white/30 text-sm mt-2">JPG, PNG. Max 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">Full Name</Label>
                    <Input
                      value={profileData.fullName || user.fullName}
                      onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Email</Label>
                    <Input
                      value={user.email}
                      disabled
                      className="bg-white/5 border-white/10 text-white/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Phone</Label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      placeholder="+91..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-white/70">Bio</Label>
                    <Input
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      placeholder="Tell us about yourself..."
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* College Tab */}
          <TabsContent value="college">
            <Card className="bg-charcoal border-white/5">
              <CardHeader>
                <CardTitle className="text-white">College Settings</CardTitle>
                <CardDescription className="text-white/50">
                  Manage your institution details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white/70">College Name</Label>
                    <Input
                      value={collegeData.collegeName}
                      onChange={(e) => setCollegeData({ ...collegeData, collegeName: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">College Code</Label>
                    <Input
                      value={collegeData.collegeCode}
                      onChange={(e) => setCollegeData({ ...collegeData, collegeCode: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Phone</Label>
                    <Input
                      value={collegeData.phone}
                      onChange={(e) => setCollegeData({ ...collegeData, phone: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Email</Label>
                    <Input
                      type="email"
                      value={collegeData.email}
                      onChange={(e) => setCollegeData({ ...collegeData, email: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-white/70">Address</Label>
                    <Input
                      value={collegeData.address}
                      onChange={(e) => setCollegeData({ ...collegeData, address: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveCollege}
                    disabled={saving}
                    className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save College Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="bg-charcoal border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Notification Preferences</CardTitle>
                <CardDescription className="text-white/50">
                  Choose how you want to be notified
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between py-4 border-b border-white/5">
                  <div>
                    <h4 className="text-white font-medium">Push Notifications</h4>
                    <p className="text-white/50 text-sm">Receive notifications in the app</p>
                  </div>
                  <Switch
                    checked={notificationSettings.notifications}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, notifications: checked })}
                  />
                </div>

                <div className="flex items-center justify-between py-4 border-b border-white/5">
                  <div>
                    <h4 className="text-white font-medium">Email Alerts</h4>
                    <p className="text-white/50 text-sm">Receive important updates via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, emailAlerts: checked })}
                  />
                </div>

                <div className="flex items-center justify-between py-4">
                  <div>
                    <h4 className="text-white font-medium">Fee Reminders</h4>
                    <p className="text-white/50 text-sm">Get reminders about pending fees</p>
                  </div>
                  <Switch
                    checked={notificationSettings.feeReminders}
                    onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, feeReminders: checked })}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={handleSaveNotifications}
                    disabled={saving}
                    className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-charcoal border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Change Password</CardTitle>
                <CardDescription className="text-white/50">
                  Update your account password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label className="text-white/70">Current Password</Label>
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-start">
                  <Button
                    onClick={handleChangePassword}
                    disabled={saving || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
                    className="bg-neon-lime text-obsidian hover:bg-neon-lime/90"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Lock className="w-4 h-4 mr-2" />
                    )}
                    Change Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
