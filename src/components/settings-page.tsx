'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Settings, Save, Loader2, AlertCircle, Building2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SettingsPageProps {
  centreId: string
  user: {
    name: string
    email: string
    centreName?: string | null
  }
}

interface CentreSettings {
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
}

export default function SettingsPage({ centreId, user }: SettingsPageProps) {
  const [settings, setSettings] = useState<CentreSettings>({
    name: user.centreName || '',
    email: '',
    phone: '',
    address: '',
    city: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchSettings = useCallback(async () => {
    if (!centreId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/centres/${centreId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        if (data && typeof data === 'object') {
          setSettings({
            name: data.name || user.centreName || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
          })
        }
      } else {
        // If settings endpoint returns 404 or error, use centre data from session
        setSettings({
          name: user.centreName || '',
          email: '',
          phone: '',
          address: '',
          city: '',
        })
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err)
      setError('خطأ في تحميل الإعدادات. يمكنك تعديل البيانات وحفظها.')
      // Use fallback data
      setSettings({
        name: user.centreName || '',
        email: '',
        phone: '',
        address: '',
        city: '',
      })
    } finally {
      setLoading(false)
    }
  }, [centreId, user.centreName])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleSave = async () => {
    if (!settings.name) {
      toast({ title: 'يرجى إدخال اسم المركز', variant: 'destructive' })
      return
    }

    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/centres/${centreId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settings.name,
          email: settings.email || null,
          phone: settings.phone || null,
          address: settings.address || null,
          city: settings.city || null,
        }),
        credentials: 'include',
      })

      if (res.ok) {
        toast({ title: 'تم حفظ الإعدادات بنجاح' })
      } else {
        const err = await res.json().catch(() => ({}))
        setError(err.message || 'خطأ في حفظ الإعدادات')
        toast({ title: err.message || 'خطأ في حفظ الإعدادات', variant: 'destructive' })
      }
    } catch (err) {
      console.error('Failed to save settings:', err)
      setError('خطأ في الاتصال بالخادم')
      toast({ title: 'خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof CentreSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  if (error && !settings.name) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">الإعدادات</h1>
          <p className="text-muted-foreground text-sm mt-1">إعدادات المركز</p>
        </div>
        <Card className="shadow-sm border-destructive/30">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div>
                <h3 className="font-semibold">خطأ في تحميل الإعدادات</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
              <Button variant="outline" onClick={fetchSettings} className="gap-2">
                <Settings className="w-4 h-4" />
                إعادة المحاولة
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الإعدادات</h1>
        <p className="text-muted-foreground text-sm mt-1">إعدادات المركز والبيانات الأساسية</p>
      </div>

      {error && settings.name && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm p-3 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            بيانات المركز
          </CardTitle>
          <CardDescription>تعديل المعلومات الأساسية للمركز</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <div className="space-y-4 max-w-lg">
              <div className="space-y-2">
                <Label htmlFor="centre-name">اسم المركز *</Label>
                <Input
                  id="centre-name"
                  value={settings.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="اسم المركز"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="centre-email">البريد الإلكتروني</Label>
                <Input
                  id="centre-email"
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="centre@example.com"
                  dir="ltr"
                  className="text-left"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="centre-phone">الهاتف</Label>
                <Input
                  id="centre-phone"
                  value={settings.phone || ''}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="0555-123-456"
                  dir="ltr"
                  className="text-left"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="centre-address">العنوان</Label>
                <Input
                  id="centre-address"
                  value={settings.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="العنوان الكامل"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="centre-city">المدينة</Label>
                <Input
                  id="centre-city"
                  value={settings.city || ''}
                  onChange={(e) => handleChange('city', e.target.value)}
                  placeholder="المدينة"
                />
              </div>

              <div className="pt-2">
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            معلومات الحساب
          </CardTitle>
          <CardDescription>معلومات مدير المركز</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-w-lg">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">الاسم</span>
              <span className="text-sm font-medium">{user.name}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">البريد الإلكتروني</span>
              <span className="text-sm font-medium" dir="ltr">{user.email}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <span className="text-sm text-muted-foreground">الدور</span>
              <span className="text-sm font-medium">مدير المركز</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
