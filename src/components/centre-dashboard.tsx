'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import {
  GraduationCap,
  Users,
  BookOpen,
  CreditCard,
  TrendingUp,
  DollarSign,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface CentreDashboardProps {
  centreId: string
}

interface StatsData {
  totalStudents: number
  totalTeachers: number
  totalGroups: number
  totalPayments: number
  paidPayments: number
  totalRevenue: number
  monthlyRevenue: { month: string; revenue: number }[]
}

interface RecentPayment {
  id: string
  amount: number
  month: string
  year: number
  isPaid: boolean
  student: { firstName: string; lastName: string }
  group?: { name: string } | null
  paidAt: string | null
}

const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']

export default function CentreDashboard({ centreId }: CentreDashboardProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [chartPage, setChartPage] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (centreId) fetchDashboardData()
  }, [centreId])

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [statsRes, paymentsRes] = await Promise.all([
        fetch(`/api/stats`, { credentials: 'include' }),
        fetch(`/api/payments?limit=5`, { credentials: 'include' }),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json()
        setRecentPayments(data.data || data || [])
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      toast({ title: 'خطأ في تحميل البيانات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const maxRevenue = stats?.monthlyRevenue
    ? Math.max(...stats.monthlyRevenue.map((m) => m.revenue), 1)
    : 1

  const statCards = [
    {
      title: 'التلاميذ',
      value: stats?.totalStudents ?? 0,
      icon: <GraduationCap className="w-5 h-5" />,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'الأساتذة',
      value: stats?.totalTeachers ?? 0,
      icon: <Users className="w-5 h-5" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'الأقسام',
      value: stats?.totalGroups ?? 0,
      icon: <BookOpen className="w-5 h-5" />,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'الإيرادات',
      value: `${(stats?.totalRevenue ?? 0).toLocaleString()} د.ج`,
      icon: <DollarSign className="w-5 h-5" />,
      color: 'text-rose-600',
      bg: 'bg-rose-500/10',
    },
  ]

  const visibleMonths = (stats?.monthlyRevenue || []).slice(chartPage * 6, chartPage * 6 + 6)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground text-sm mt-1">نظرة عامة على نشاط المركز</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  {loading ? (
                    <Skeleton className="h-7 w-16 mt-1" />
                  ) : (
                    <p className="text-xl font-bold mt-1">{card.value}</p>
                  )}
                </div>
                <div className={`${card.bg} ${card.color} p-2.5 rounded-xl`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500/10 text-emerald-600 p-2 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">المدفوع</p>
                <p className="text-lg font-bold">{stats?.paidPayments ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-red-500/10 text-red-600 p-2 rounded-lg">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">غير المدفوع</p>
                <p className="text-lg font-bold">{(stats?.totalPayments ?? 0) - (stats?.paidPayments ?? 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-2 rounded-lg">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">نسبة التحصيل</p>
                <p className="text-lg font-bold">
                  {stats?.totalPayments
                    ? Math.round(((stats.paidPayments / stats.totalPayments) * 100))
                    : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              الإيرادات الشهرية
            </CardTitle>
            {(stats?.monthlyRevenue?.length ?? 0) > 6 && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setChartPage(Math.max(0, chartPage - 1))}
                  disabled={chartPage === 0}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground px-2">
                  {chartPage + 1} / {Math.ceil((stats?.monthlyRevenue?.length || 0) / 6)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setChartPage(chartPage + 1)}
                  disabled={chartPage * 6 + 6 >= (stats?.monthlyRevenue?.length || 0)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-48 w-full" />
          ) : visibleMonths.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <TrendingUp className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>لا توجد بيانات إيرادات بعد</p>
            </div>
          ) : (
            <div className="flex items-end gap-3 h-48">
              {visibleMonths.map((item) => {
                const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.revenue > 0 ? `${(item.revenue / 1000).toFixed(1)}k` : '0'}
                    </span>
                    <div
                      className="w-full bg-primary/20 rounded-t-md relative overflow-hidden"
                      style={{ height: `${Math.max(height, 4)}%` }}
                    >
                      <div
                        className="absolute inset-0 bg-primary/60 rounded-t-md"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {MONTHS_AR[parseInt(item.month) - 1] || item.month}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            أحدث المدفوعات
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : recentPayments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>لا توجد مدفوعات بعد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">التلميذ</TableHead>
                  <TableHead className="text-right">القسم</TableHead>
                  <TableHead className="text-right">الشهر</TableHead>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentPayments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium">
                      {payment.student.firstName} {payment.student.lastName}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {payment.group?.name || '—'}
                    </TableCell>
                    <TableCell>
                      {MONTHS_AR[parseInt(payment.month) - 1] || payment.month} {payment.year}
                    </TableCell>
                    <TableCell className="font-medium">{payment.amount.toLocaleString()} د.ج</TableCell>
                    <TableCell>
                      {payment.isPaid ? (
                        <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-0">
                          مدفوع
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-0">
                          غير مدفوع
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
