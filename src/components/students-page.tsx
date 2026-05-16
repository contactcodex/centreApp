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
  GraduationCap,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Student {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  parentName: string | null
  parentPhone: string | null
  level: string | null
  createdAt: string
}

interface StudentForm {
  firstName: string
  lastName: string
  phone: string
  parentName: string
  parentPhone: string
  level: string
}

const emptyForm: StudentForm = {
  firstName: '',
  lastName: '',
  phone: '',
  parentName: '',
  parentPhone: '',
  level: '',
}

const ITEMS_PER_PAGE = 10

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [form, setForm] = useState<StudentForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students', { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setStudents(Array.isArray(data) ? data : (data.students || []))
      }
    } catch {
      toast({ title: 'خطأ في تحميل التلاميذ', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const filtered = students.filter(
    (s) =>
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      (s.phone && s.phone.includes(search)) ||
      (s.parentName && s.parentName.toLowerCase().includes(search.toLowerCase())) ||
      (s.level && s.level.toLowerCase().includes(search.toLowerCase()))
  )

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (student: Student) => {
    setEditing(student)
    setForm({
      firstName: student.firstName,
      lastName: student.lastName,
      phone: student.phone || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
      level: student.level || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName) {
      toast({ title: 'يرجى إدخال اسم التلميذ', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const url = editing
        ? `/api/students/${editing.id}`
        : `/api/students`
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          phone: form.phone || null,
          parentName: form.parentName || null,
          parentPhone: form.parentPhone || null,
          level: form.level || null,
        }),
        credentials: 'include',
      })

      if (res.ok) {
        toast({ title: editing ? 'تم تحديث بيانات التلميذ' : 'تم إضافة التلميذ بنجاح' })
        setDialogOpen(false)
        fetchStudents()
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
      const res = await fetch(`/api/students/${deleteId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast({ title: 'تم حذف التلميذ' })
        setDeleteId(null)
        fetchStudents()
      }
    } catch {
      toast({ title: 'خطأ في حذف التلميذ', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">التلاميذ</h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة التلاميذ المسجلين ({filtered.length} تلميذ)
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة تلميذ
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن تلميذ..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="pr-10"
        />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">لا يوجد تلاميذ</p>
              <p className="text-sm mt-1">قم بإضافة تلميذ جديد</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الاسم الكامل</TableHead>
                      <TableHead className="text-right">الهاتف</TableHead>
                      <TableHead className="text-right">ولي الأمر</TableHead>
                      <TableHead className="text-right">المستوى</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">
                          {student.firstName} {student.lastName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{student.phone || '—'}</TableCell>
                        <TableCell>
                          <div>
                            <span className="text-sm">{student.parentName || '—'}</span>
                            {student.parentPhone && (
                              <span className="text-xs text-muted-foreground block">{student.parentPhone}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {student.level ? (
                            <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                              {student.level}
                            </span>
                          ) : '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(student)}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => setDeleteId(student.id)}
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
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t">
                  <span className="text-sm text-muted-foreground">
                    صفحة {page} من {totalPages}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'تعديل بيانات التلميذ' : 'إضافة تلميذ جديد'}</DialogTitle>
            <DialogDescription>
              {editing ? 'قم بتعديل بيانات التلميذ' : 'أدخل بيانات التلميذ الجديد'}
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>اسم ولي الأمر</Label>
                <Input value={form.parentName} onChange={(e) => setForm({ ...form, parentName: e.target.value })} placeholder="اسم الأب/الأم" />
              </div>
              <div className="space-y-2">
                <Label>هاتف ولي الأمر</Label>
                <Input value={form.parentPhone} onChange={(e) => setForm({ ...form, parentPhone: e.target.value })} placeholder="0555-123-456" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>المستوى</Label>
              <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="مثال: السنة الأولى ابتدائي" />
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
            <AlertDialogTitle>حذف التلميذ</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا التلميذ؟ سيتم حذف جميع بياناته والمدفوعات المرتبطة به.
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
