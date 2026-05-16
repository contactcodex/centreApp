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
  CreditCard,
  CheckCircle2,
  XCircle,
  DollarSign,
  Filter,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Payment {
  id: string
  amount: number
  month: string
  year: number
  isPaid: boolean
  paidAt: string | null
  note: string | null
  student: { id: string; firstName: string; lastName: string }
  group?: { id: string; name: string } | null
}

interface Student {
  id: string
  firstName: string
  lastName: string
}

interface Group {
  id: string
  name: string
}

interface PaymentForm {
  studentId: string
  groupId: string
  amount: string
  month: string
  year: string
  note: string
}

const emptyForm: PaymentForm = {
  studentId: '',
  groupId: '',
  amount: '',
  month: new Date().getMonth() + 1 > 9 ? String(new Date().getMonth() + 1) : `0${new Date().getMonth() + 1}`,
  year: String(new Date().getFullYear()),
  note: '',
}

const MONTHS = [
  { value: '01', label: 'يناير' },
  { value: '02', label: 'فبراير' },
  { value: '03', label: 'مارس' },
  { value: '04', label: 'أبريل' },
  { value: '05', label: 'مايو' },
  { value: '06', label: 'يونيو' },
  { value: '07', label: 'يوليو' },
  { value: '08', label: 'أغسطس' },
  { value: '09', label: 'سبتمبر' },
  { value: '10', label: 'أكتوبر' },
  { value: '11', label: 'نوفمبر' },
  { value: '12', label: 'ديسمبر' },
]

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterMonth, setFilterMonth] = useState('all')
  const [filterYear, setFilterYear] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Payment | null>(null)
  const [form, setForm] = useState<PaymentForm>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchData = useCallback(async () => {
    try {
      const [paymentsRes, studentsRes, groupsRes] = await Promise.all([
        fetch('/api/payments', { credentials: 'include' }),
        fetch('/api/students', { credentials: 'include' }),
        fetch('/api/groups', { credentials: 'include' }),
      ])

      if (paymentsRes.ok) {
        const data = await paymentsRes.json()
        setPayments(Array.isArray(data) ? data : (data.payments || []))
      }
      if (studentsRes.ok) {
        const data = await studentsRes.json()
        setStudents(Array.isArray(data) ? data : (data.students || []))
      }
      if (groupsRes.ok) {
        const data = await groupsRes.json()
        setGroups(Array.isArray(data) ? data : (data.groups || []))
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

  const filtered = payments.filter((p) => {
    if (search && !`${p.student.firstName} ${p.student.lastName}`.toLowerCase().includes(search.toLowerCase())) {
      return false
    }
    if (filterMonth !== 'all' && p.month !== filterMonth) return false
    if (filterYear !== 'all' && String(p.year) !== filterYear) return false
    if (filterStatus === 'paid' && !p.isPaid) return false
    if (filterStatus === 'unpaid' && p.isPaid) return false
    return true
  })

  const paidCount = filtered.filter((p) => p.isPaid).length
  const unpaidCount = filtered.filter((p) => !p.isPaid).length
  const totalPaid = filtered.filter((p) => p.isPaid).reduce((sum, p) => sum + p.amount, 0)
  const totalUnpaid = filtered.filter((p) => !p.isPaid).reduce((sum, p) => sum + p.amount, 0)

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setDialogOpen(true)
  }

  const openEdit = (payment: Payment) => {
    setEditing(payment)
    setForm({
      studentId: payment.student.id,
      groupId: payment.group?.id || '',
      amount: String(payment.amount),
      month: payment.month,
      year: String(payment.year),
      note: payment.note || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.studentId || !form.amount) {
      toast({ title: 'يرجى ملء الحقول المطلوبة', variant: 'destructive' })
      return
    }

    setSubmitting(true)
    try {
      const url = editing
        ? `/api/payments/${editing.id}`
        : `/api/payments`
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: form.studentId,
          groupId: form.groupId || null,
          amount: parseFloat(form.amount),
          month: form.month,
          year: parseInt(form.year),
          isPaid: editing?.isPaid ?? false,
          note: form.note || null,
        }),
        credentials: 'include',
      })

      if (res.ok) {
        toast({ title: editing ? 'تم تحديث الدفعة' : 'تم إضافة الدفعة بنجاح' })
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

  const togglePaid = async (payment: Payment) => {
    try {
      const res = await fetch(`/api/payments/${payment.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPaid: !payment.isPaid }),
        credentials: 'include',
      })
      if (res.ok) {
        toast({ title: payment.isPaid ? 'تم تحديد كغير مدفوع' : 'تم تحديد كمدفوع' })
        fetchData()
      }
    } catch {
      toast({ title: 'خطأ في تحديث الدفعة', variant: 'destructive' })
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const res = await fetch(`/api/payments/${deleteId}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        toast({ title: 'تم حذف الدفعة' })
        setDeleteId(null)
        fetchData()
      }
    } catch {
      toast({ title: 'خطأ في حذف الدفعة', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">الأقساط</h1>
          <p className="text-muted-foreground text-sm mt-1">إدارة المدفوعات والأقساط ({filtered.length} دفعة)</p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          إضافة دفعة
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 text-emerald-600 p-2 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المدفوع</p>
                <p className="text-lg font-bold">{paidCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/10 text-red-600 p-2 rounded-lg">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">غير المدفوع</p>
                <p className="text-lg font-bold">{unpaidCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 text-emerald-600 p-2 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المبالغ المحصلة</p>
                <p className="text-sm font-bold">{totalPaid.toLocaleString()} د.ج</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/10 text-red-600 p-2 rounded-lg">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">المبالغ المتبقية</p>
                <p className="text-sm font-bold">{totalUnpaid.toLocaleString()} د.ج</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="بحث عن تلميذ..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-32">
              <Filter className="w-3.5 h-3.5 ml-1" />
              <SelectValue placeholder="الشهر" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأشهر</SelectItem>
              {MONTHS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="السنة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل السنوات</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="paid">مدفوع</SelectItem>
              <SelectItem value="unpaid">غير مدفوع</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Payments Table */}
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
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">لا توجد دفعات</p>
              <p className="text-sm mt-1">قم بإضافة دفعة جديدة</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">التلميذ</TableHead>
                    <TableHead className="text-right">القسم</TableHead>
                    <TableHead className="text-right">الشهر</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {payment.student.firstName} {payment.student.lastName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {payment.group?.name || '—'}
                      </TableCell>
                      <TableCell>
                        {MONTHS.find((m) => m.value === payment.month)?.label || payment.month} {payment.year}
                      </TableCell>
                      <TableCell className="font-medium">{payment.amount.toLocaleString()} د.ج</TableCell>
                      <TableCell>
                        {payment.isPaid ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">مدفوع</Badge>
                        ) : (
                          <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">غير مدفوع</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => togglePaid(payment)}
                            title={payment.isPaid ? 'تحديد كغير مدفوع' : 'تحديد كمدفوع'}
                          >
                            {payment.isPaid ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-red-500" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(payment)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(payment.id)}
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
            <DialogTitle>{editing ? 'تعديل الدفعة' : 'إضافة دفعة جديدة'}</DialogTitle>
            <DialogDescription>
              {editing ? 'قم بتعديل بيانات الدفعة' : 'أدخل بيانات الدفعة الجديدة'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-2">
              <Label>التلميذ *</Label>
              <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر التلميذ" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>القسم</Label>
              <Select value={form.groupId} onValueChange={(v) => setForm({ ...form, groupId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر القسم (اختياري)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">بدون قسم</SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label>المبلغ *</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label>الشهر</Label>
                <Select value={form.month} onValueChange={(v) => setForm({ ...form, month: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>السنة</Label>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm({ ...form, year: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>ملاحظة</Label>
              <Input
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                placeholder="ملاحظة اختيارية"
              />
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
      <Dialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>حذف الدفعة</DialogTitle>
            <DialogDescription>هل أنت متأكد من حذف هذه الدفعة؟</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>إلغاء</Button>
            <Button onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
