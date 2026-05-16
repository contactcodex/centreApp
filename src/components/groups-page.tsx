'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
  Loader2,
  BookOpen,
  UserPlus,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Group {
  id: string
  name: string
  level: string | null
  schedule: string | null
  createdAt: string
  teacher?: { id: string; firstName: string; lastName: string } | null
  _count?: { students: number }
}

interface Teacher {
  id: string
  firstName: string
  lastName: string
  subject: string | null
}

interface Student {
  id: string
  firstName: string
  lastName: string
}

interface GroupForm {
  name: string
  level: string
  schedule: string
  teacherId: string
}

const emptyForm: GroupForm = {
  name: '',
  level: '',
  schedule: '',
  teacherId: '',
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [studentsDialogOpen, setStudentsDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Group | null>(null)
  const [form, setForm] = useState<GroupForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [groupStudents, setGroupStudents] = useState<Student[]>([])
  const [addingStudent, setAddingStudent] = useState(false)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const [groupsRes, teachersRes, studentsRes] = await Promise.all([
        fetch('/api/groups', { credentials: 'include' }),
        fetch('/api/teachers', { credentials: 'include' }),
        fetch('/api/students', { credentials: 'include' }),
      ])

      if (groupsRes.ok) {
        const data = await groupsRes.json()
        setGroups(Array.isArray(data) ? data : (data.groups || []))
      }
      if (teachersRes.ok) {
        const data = await teachersRes.json()
        setTeachers(Array.isArray(data) ? data : (data.teachers || []))
      }
      if (studentsRes.ok) {
        const data = await studentsRes.json()
        setStudents(Array.isArray(data) ? data : (data.students || []))
      }
    } catch {
      toast({ title: 'خطأ في تحميل البيانات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const filtered = groups.filter(
    (g) =>
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      (g.level && g.level.toLowerCase().includes(search.toLowerCase())) ||
      (g.teacher && `${g.teacher.firstName} ${g.teacher.lastName}`.toLowerCase().includes(search.toLowerCase()))
  )

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (group: Group) => {
    setEditing(group)
    setForm({
      name: group.name,
      level: group.level || '',
      schedule: group.schedule || '',
      teacherId: group.teacher?.id || '',
    })
    setDialogOpen(true)
  }

  const openStudentsDialog = async (groupId: string) => {
    setSelectedGroupId(groupId)
    setStudentsDialogOpen(true)
    try {
      const res = await fetch(`/api/groups/${groupId}`, { credentials: 'include' })
      if (res.ok) {
        const data = await res.json()
        setGroupStudents(data.students || [])
      }
    } catch {
      toast({ title: 'خطأ في تحميل التلاميذ', variant: 'destructive' })
    }
  }

  const handleSubmit = async () => {
    if (!form.name) {
      toast({ title: 'يرجى إدخال اسم القسم', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const url = editing
        ? `/api/groups/${editing.id}`
        : `/api/groups`
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          level: form.level || null,
          schedule: form.schedule || null,
          teacherId: form.teacherId || null,
        }),
        credentials: 'include',
      })

      if (res.ok) {
        toast({ title: editing ? 'تم تحديث القسم' : 'تم إنشاء القسم بنجاح' })
        setDialogOpen(false)
        fetchData()
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
      const res = await fetch(`/api/groups/${deleteId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast({ title: 'تم حذف القسم' })
        setDeleteId(null)
        fetchData()
      }
    } catch {
      toast({ title: 'خطأ في حذف القسم', variant: 'destructive' })
    }
  }

  const addStudentToGroup = async (studentId: string) => {
    if (!selectedGroupId) return
    setAddingStudent(true)
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
        credentials: 'include',
      })
      if (res.ok) {
        toast({ title: 'تم إضافة التلميذ' })
        openStudentsDialog(selectedGroupId)
      }
    } catch {
      toast({ title: 'خطأ في إضافة التلميذ', variant: 'destructive' })
    } finally {
      setAddingStudent(false)
    }
  }

  const removeStudentFromGroup = async (studentId: string) => {
    if (!selectedGroupId) return
    try {
      const res = await fetch(`/api/groups/${selectedGroupId}/students/${studentId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast({ title: 'تم إزالة التلميذ' })
        openStudentsDialog(selectedGroupId)
      }
    } catch {
      toast({ title: 'خطأ في إزالة التلميذ', variant: 'destructive' })
    }
  }

  const availableStudents = students.filter(
    (s) => !groupStudents.find((gs) => gs.id === s.id)
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الأقسام</h1>
          <p className="text-muted-foreground text-sm mt-1">
            إدارة الأقسام الدراسية ({filtered.length} قسم)
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          إنشاء قسم
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="بحث عن قسم..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pr-10"
        />
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">لا توجد أقسام</p>
              <p className="text-sm mt-1">قم بإنشاء قسم جديد</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">اسم القسم</TableHead>
                    <TableHead className="text-right">المستوى</TableHead>
                    <TableHead className="text-right">الأستاذ</TableHead>
                    <TableHead className="text-right">التلاميذ</TableHead>
                    <TableHead className="text-right">الجدول</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-medium">{group.name}</TableCell>
                      <TableCell>
                        {group.level ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                            {group.level}
                          </span>
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        {group.teacher
                          ? `${group.teacher.firstName} ${group.teacher.lastName}`
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-primary"
                          onClick={() => openStudentsDialog(group.id)}
                        >
                          <Badge variant="secondary" className="font-mono">
                            {group._count?.students ?? 0}
                          </Badge>
                          <span className="text-xs">تلميذ</span>
                        </Button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {group.schedule || '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(group)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(group.id)}
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
            <DialogTitle>{editing ? 'تعديل القسم' : 'إنشاء قسم جديد'}</DialogTitle>
            <DialogDescription>
              {editing ? 'قم بتعديل بيانات القسم' : 'أدخل بيانات القسم الجديد'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>اسم القسم *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: قسم أ - السنة الرابعة" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>المستوى</Label>
                <Input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="السنة الرابعة" />
              </div>
              <div className="space-y-2">
                <Label>الجدول</Label>
                <Input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="مثال: السبت والاثنين 10:00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الأستاذ</Label>
              <Select value={form.teacherId} onValueChange={(v) => setForm({ ...form, teacherId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الأستاذ" />
                </SelectTrigger>
                <SelectContent>
                  {teachers.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} {t.subject ? `(${t.subject})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              {editing ? 'حفظ التغييرات' : 'إنشاء'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Students Dialog */}
      <Dialog open={studentsDialogOpen} onOpenChange={setStudentsDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>تلاميذ القسم</DialogTitle>
            <DialogDescription>إضافة أو إزالة تلاميذ من هذا القسم</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {groupStudents.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">لا يوجد تلاميذ في هذا القسم</p>
            ) : (
              groupStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <span className="text-sm">{student.firstName} {student.lastName}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeStudentFromGroup(student.id)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))
            )}
          </div>
          {availableStudents.length > 0 && (
            <div className="border-t pt-3">
              <Label className="text-sm">إضافة تلميذ</Label>
              <Select onValueChange={(v) => addStudentToGroup(v)} disabled={addingStudent}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="اختر تلميذ..." />
                </SelectTrigger>
                <SelectContent>
                  {availableStudents.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف القسم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا القسم؟ سيتم فك الارتباط مع التلاميذ.
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
