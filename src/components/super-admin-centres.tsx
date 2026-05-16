'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Power,
  Clock,
  Eye,
  RefreshCw,
  Loader2,
  Building2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Centre {
  id: string
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  isActive: boolean
  trialEndsAt: string | null
  createdAt: string
  admin?: { id: string; name: string; email: string } | null
  _count?: { students: number; teachers: number; groups: number }
}

interface CreateCentreForm {
  centreName: string
  centreEmail: string
  centrePhone: string
  centreAddress: string
  centreCity: string
  adminName: string
  adminEmail: string
  adminPassword: string
  trialHours: string
}

const emptyForm: CreateCentreForm = {
  centreName: '',
  centreEmail: '',
  centrePhone: '',
  centreAddress: '',
  centreCity: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
  trialHours: '24',
}

function getCentreStatus(centre: Centre): string {
  if (!centre.isActive) return 'expired'
  if (centre.trialEndsAt) {
    const trialEnd = new Date(centre.trialEndsAt)
    if (new Date() > trialEnd) return 'expired'
    return 'trial'
  }
  return 'active'
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'active':
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">نشط</Badge>
    case 'trial':
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-0">فترة تجريبية</Badge>
    case 'expired':
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">منتهي</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export default function SuperAdminCentres() {
  const [centres, setCentres] = useState<Centre[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCentre, setEditingCentre] = useState<Centre | null>(null)
  const [form, setForm] = useState<CreateCentreForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [extendId, setExtendId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchCentres = useCallback(async () => {
    try {
      const res = await fetch('/api/centres', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setCentres(Array.isArray(data) ? data : (data.data || []))
      }
    } catch (err) {
      console.error('Failed to fetch centres:', err)
      toast({ title: 'خطأ في تحميل المراكز', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchCentres()
  }, [fetchCentres])

  const filteredCentres = centres.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase())) ||
      (c.admin?.name && c.admin.name.toLowerCase().includes(search.toLowerCase()))
  )

  const openCreateDialog = () => {
    setEditingCentre(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEditDialog = (centre: Centre) => {
    setEditingCentre(centre)
    setForm({
      centreName: centre.name,
      centreEmail: centre.email,
      centrePhone: centre.phone || '',
      centreAddress: centre.address || '',
      centreCity: centre.city || '',
      adminName: centre.admin?.name || '',
      adminEmail: centre.admin?.email || '',
      adminPassword: '',
      trialHours: '24',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.centreName || !form.centreEmail) {
      toast({ title: 'يرجى ملء الحقول المطلوبة', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const url = editingCentre
        ? `/api/centres/${editingCentre.id}`
        : `/api/centres`
      const method = editingCentre ? 'PATCH' : 'POST'

      const body = editingCentre
        ? {
            name: form.centreName,
            email: form.centreEmail,
            phone: form.centrePhone || null,
            address: form.centreAddress || null,
            city: form.centreCity || null,
          }
        : {
            name: form.centreName,
            email: form.centreEmail,
            phone: form.centrePhone || null,
            address: form.centreAddress || null,
            city: form.centreCity || null,
            adminName: form.adminName || form.centreName,
            adminEmail: form.adminEmail || `${form.centreName.toLowerCase().replace(/\s/g, '.')}@centre.com`,
            adminPassword: form.adminPassword,
            trialHours: parseInt(form.trialHours) || 24,
          }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        credentials: 'include',
      })

      if (res.ok) {
        toast({
          title: editingCentre ? 'تم تحديث المركز بنجاح' : 'تم إنشاء المركز بنجاح',
        })
        setDialogOpen(false)
        fetchCentres()
      } else {
        const error = await res.json()
        toast({ title: error.message || 'حدث خطأ', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleActive = async (centre: Centre) => {
    try {
      const res = await fetch(`/api/centres/${centre.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !centre.isActive }),
        credentials: 'include',
      })
      if (res.ok) {
        toast({ title: centre.isActive ? 'تم تعطيل المركز' : 'تم تفعيل المركز' })
        fetchCentres()
      }
    } catch {
      toast({ title: 'خطأ في تحديث المركز', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/centres/${deleteId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast({ title: 'تم حذف المركز بنجاح' })
        setDeleteId(null)
        fetchCentres()
      }
    } catch {
      toast({ title: 'خطأ في حذف المركز', variant: 'destructive' })
    }
  }

  const handleExtendTrial = async () => {
    if (!extendId) return
    try {
      const res = await fetch(`/api/centres/${extendId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trialEndsAt: new Date(Date.now() + 168 * 60 * 60 * 1000).toISOString() }),
        credentials: 'include',
      })
      if (res.ok) {
        toast({ title: 'تم تمديد الفترة التجريبية بنجاح' })
        setExtendId(null)
        fetchCentres()
      } else {
        toast({ title: 'خطأ في تمديد الفترة التجريبية', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ في الاتصال', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">إدارة المراكز</h1>
          <p className="text-muted-foreground text-sm mt-1">
            عرض وإدارة جميع المراكز التعليمية ({filteredCentres.length} مركز)
          </p>
        </div>
        <Button onClick={openCreateDialog} className="gap-2">
          <Plus className="w-4 h-4" />
          إنشاء مركز جديد
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن مركز..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Centres Table */}
      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredCentres.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">لا توجد مراكز</p>
              <p className="text-sm mt-1">قم بإنشاء مركز جديد للبدء</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم المركز</TableHead>
                    <TableHead className="text-right">البريد الإلكتروني</TableHead>
                    <TableHead className="text-right">المدير</TableHead>
                    <TableHead className="text-right">المدينة</TableHead>
                    <TableHead className="text-right">التلاميذ</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">تاريخ الإنشاء</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCentres.map((centre) => (
                    <TableRow key={centre.id}>
                      <TableCell className="font-medium">{centre.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{centre.email}</TableCell>
                      <TableCell>{centre.admin?.name || '—'}</TableCell>
                      <TableCell>{centre.city || '—'}</TableCell>
                      <TableCell>{centre._count?.students ?? 0}</TableCell>
                      <TableCell>{getStatusBadge(getCentreStatus(centre))}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(centre.createdAt).toLocaleDateString('ar-DZ')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(centre)}
                            title="تعديل"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleToggleActive(centre)}
                            title={centre.isActive ? 'تعطيل' : 'تفعيل'}
                          >
                            {centre.isActive ? (
                              <Power className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Power className="w-3.5 h-3.5 text-red-500" />
                            )}
                          </Button>
                          {getCentreStatus(centre) === 'trial' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setExtendId(centre.id)}
                              title="تمديد التجربة"
                            >
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(centre.id)}
                            title="حذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCentre ? 'تعديل المركز' : 'إنشاء مركز جديد'}
            </DialogTitle>
            <DialogDescription>
              {editingCentre
                ? 'قم بتعديل بيانات المركز'
                : 'أدخل بيانات المركز والمدير الجديد'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <h3 className="font-medium text-sm text-muted-foreground">بيانات المركز</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>اسم المركز *</Label>
                <Input
                  value={form.centreName}
                  onChange={(e) => setForm({ ...form, centreName: e.target.value })}
                  placeholder="مثال: مركز النور"
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني *</Label>
                <Input
                  type="email"
                  value={form.centreEmail}
                  onChange={(e) => setForm({ ...form, centreEmail: e.target.value })}
                  placeholder="centre@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>الهاتف</Label>
                <Input
                  value={form.centrePhone}
                  onChange={(e) => setForm({ ...form, centrePhone: e.target.value })}
                  placeholder="0555-123-456"
                />
              </div>
              <div className="space-y-2">
                <Label>المدينة</Label>
                <Input
                  value={form.centreCity}
                  onChange={(e) => setForm({ ...form, centreCity: e.target.value })}
                  placeholder="مثال: الجزائر"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input
                value={form.centreAddress}
                onChange={(e) => setForm({ ...form, centreAddress: e.target.value })}
                placeholder="العنوان الكامل"
              />
            </div>

            {!editingCentre && (
              <>
                <h3 className="font-medium text-sm text-muted-foreground pt-2">بيانات المدير</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>اسم المدير</Label>
                    <Input
                      value={form.adminName}
                      onChange={(e) => setForm({ ...form, adminName: e.target.value })}
                      placeholder="اسم المدير"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>بريد المدير</Label>
                    <Input
                      type="email"
                      value={form.adminEmail}
                      onChange={(e) => setForm({ ...form, adminEmail: e.target.value })}
                      placeholder="admin@example.com"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>كلمة المرور</Label>
                    <Input
                      type="password"
                      value={form.adminPassword}
                      onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
                      placeholder="كلمة مرور مؤقتة"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>مدة التجربة</Label>
                    <Select
                      value={form.trialHours}
                      onValueChange={(v) => setForm({ ...form, trialHours: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24">24 ساعة</SelectItem>
                        <SelectItem value="72">3 أيام</SelectItem>
                        <SelectItem value="168">7 أيام</SelectItem>
                        <SelectItem value="336">14 يوم</SelectItem>
                        <SelectItem value="720">30 يوم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              {editingCentre ? 'حفظ التغييرات' : 'إنشاء المركز'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف المركز</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا المركز؟ سيتم حذف جميع البيانات المرتبطة به. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Extend Trial Confirmation */}
      <AlertDialog open={!!extendId} onOpenChange={(open) => !open && setExtendId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تمديد الفترة التجريبية</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد تمديد الفترة التجريبية لمدة 7 أيام إضافية؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleExtendTrial}>
              تمديد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
