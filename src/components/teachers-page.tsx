'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Skeleton } from '@/components/ui/skeleton'
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Loader2,
  Users,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Teacher {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  subject: string | null
  createdAt: string
  _count?: { groups: number }
}

interface TeacherForm {
  firstName: string
  lastName: string
  phone: string
  subject: string
}

const emptyForm: TeacherForm = {
  firstName: '',
  lastName: '',
  phone: '',
  subject: '',
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const [form, setForm] = useState<TeacherForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchTeachers = useCallback(async () => {
    try {
      const res = await fetch('/api/teachers', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setTeachers(Array.isArray(data) ? data : (data.teachers || []))
      }
    } catch {
      toast({ title: 'خطأ في تحميل الأساتذة', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  const filtered = teachers.filter(
    (t) =>
      `${t.firstName} ${t.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (t.phone && t.phone.includes(search)) ||
      (t.subject && t.subject.toLowerCase().includes(search.toLowerCase()))
  )

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (teacher: Teacher) => {
    setEditing(teacher)
    setForm({
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      phone: teacher.phone || '',
      subject: teacher.subject || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName) {
      toast({ title: 'يرجى إدخال اسم الأستاذ', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const url = editing
        ? `/api/teachers/${editing.id}`
        : `/api/teachers`
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || null,
          subject: form.subject || null,
        }),
        credentials: 'include',
      })

      if (res.ok) {
        toast({ title: editing ? 'تم تحديث بيانات الأستاذ' : 'تم إضافة الأستاذ بنجاح' })
        setDialogOpen(false)
        fetchTeachers()
      } else {
        const err = await res.json()
        toast({ title: err.message || 'حدث خطأ', variant: 'destructive' })
      }
    } catch {
      toast({ title: 'خطأ في الاتصال', variant: 'destructive' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/teachers/${deleteId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast({ title: 'تم حذف الأستاذ' })
        setDeleteId(null)
        fetchTeachers()
      }
    } catch {
      toast({ title: 'خطأ في حذف الأستاذ', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الأساتذة</h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة الأساتذة ({filtered.length} أستاذ)
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة أستاذ
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن أستاذ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">لا يوجد أساتذة</p>
              <p className="text-sm mt-1">قم بإضافة أستاذ جديد</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الاسم الكامل</TableHead>
                    <TableHead className="text-right">الهاتف</TableHead>
                    <TableHead className="text-right">المادة</TableHead>
                    <TableHead className="text-right">الأقسام</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">
                        {teacher.firstName} {teacher.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{teacher.phone || '—'}</TableCell>
                      <TableCell>
                        {teacher.subject ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                            {teacher.subject}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {teacher._count?.groups ?? 0}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(teacher)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(teacher.id)}
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل بيانات الأستاذ' : 'إضافة أستاذ جديد'}</DialogTitle>
            <DialogDescription>
              {editing ? 'قم بتعديل بيانات الأستاذ' : 'أدخل بيانات الأستاذ الجديد'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>الاسم *</Label>
                <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} placeholder="الاسم" />
              </div>
              <div className="space-y-2">
                <Label>اللقب *</Label>
                <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} placeholder="اللقب" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الهاتف</Label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0555-123-456" />
            </div>
            <div className="space-y-2">
              <Label>المادة</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="مثال: الرياضيات" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              {editing ? 'حفظ التغييرات' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الأستاذ</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا الأستاذ؟ سيتم فك الارتباط مع الأقسام المرتبطة.
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
    </div>
  )
}
