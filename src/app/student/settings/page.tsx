'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/auth-context'
import { getAuthHeaders } from '@/lib/api-helpers'
import DashboardLayout from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  User, 
  Bell, 
  Lock, 
  Camera,
  Save,
  Loader2
} from 'lucide-react'

export default function StudentSettings() {
  const { user, firebaseUser, loading } = useAuth()
  const router = useRouter()
  
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  
  const [profileData, setProfileData] = useState({
    fullName: '',
    phone: '',
    bio: '',
  })
  
  const [notificationSettings, setNotificationSettings] = useState({
    notifications: true,
    emailAlerts: true,
    feeReminders: true,
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (!loading && user && user.role !== 'STUDENT') {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      fetchSettings()
    }
  }, [user])

  const fetchSettings = async () => {
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/settings', { headers })
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

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers,
        body: JSON.stringify(profileData),
      })
      
      if (res.ok) {
        alert('Profile updated successfully')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update profile')
      }
    } catch (error) {
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setSaving(true)
    try {
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify(notificationSettings),
      })
      
      if (res.ok) {
        alert('Notification settings updated successfully')
      } else {
        const error = await res.json()
        alert(error.error || 'Failed to update notification settings')
      }
    } catch (error) {
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
      const headers = await getAuthHeaders(firebaseUser)
      const res = await fetch('/api/settings/password', {
        method: 'PUT',
        headers,
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
      alert('Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  if (loading || user?.role !== 'HOD') {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-white/50 mt-1">Manage your profile and preferences</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-charcoal border-white/5">
            <TabsTrigger value="profile" className="data-[state=active]:bg-neon-lime data-[state=active]:text-obsidian">
              <User className="w-4 h-4 mr-2" />
              Profile
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

          <TabsContent value="profile">
            <Card className="bg-charcoal border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Profile Information</CardTitle>
                <CardDescription className="text-white/50">Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-neon-lime text-obsidian text-2xl">
                      {user.fullName?.[0]?.toUpperCase() || 'H'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" className="border-white/10 text-white">
                      <Camera className="w-4 h-4 mr-2" />
                      Change Photo
                    </Button>
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
                    <Input value={user.email} disabled className="bg-white/5 border-white/10 text-white/50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/70">Phone</Label>
                    <Input
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-white/70">Bio</Label>
                    <Input
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveProfile} disabled={saving} className="bg-neon-lime text-obsidian">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-charcoal border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Notification Preferences</CardTitle>
                <CardDescription className="text-white/50">Choose how you want to be notified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'notifications', title: 'Push Notifications', desc: 'Receive notifications in the app' },
                  { key: 'emailAlerts', title: 'Email Alerts', desc: 'Receive important updates via email' },
                  { key: 'feeReminders', title: 'Fee Reminders', desc: 'Get reminders about pending fees' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                    <div>
                      <h4 className="text-white font-medium">{item.title}</h4>
                      <p className="text-white/50 text-sm">{item.desc}</p>
                    </div>
                    <Switch
                      checked={notificationSettings[item.key as keyof typeof notificationSettings]}
                      onCheckedChange={(checked) => 
                        setNotificationSettings({ ...notificationSettings, [item.key]: checked })
                      }
                    />
                  </div>
                ))}

                <div className="flex justify-end">
                  <Button onClick={handleSaveNotifications} disabled={saving} className="bg-neon-lime text-obsidian">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security">
            <Card className="bg-charcoal border-white/5">
              <CardHeader>
                <CardTitle className="text-white">Change Password</CardTitle>
                <CardDescription className="text-white/50">Update your account password</CardDescription>
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
                    className="bg-neon-lime text-obsidian"
                  >
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
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
