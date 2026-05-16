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
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Plus,
  TrendingUp,
  Users,
  AlertTriangle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SuperAdminDashboardProps {
  onNavigate: (page: string) => void
}

interface StatsData {
  totalCentres: number
  activeCentres: number
  trialCentres: number
  expiredCentres: number
  totalStudents: number
  totalTeachers: number
}

interface Centre {
  id: string
  name: string
  email: string
  city: string | null
  isActive: boolean
  trialEndsAt: string | null
  createdAt: string
  admin?: { name: string } | null
  _count?: { students: number; teachers: number }
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

function getCentreStatus(centre: Centre): string {
  if (!centre.isActive) return 'expired'
  if (centre.trialEndsAt) {
    const trialEnd = new Date(centre.trialEndsAt)
    if (new Date() > trialEnd) return 'expired'
    return 'trial'
  }
  return 'active'
}

export default function SuperAdminDashboard({ onNavigate }: SuperAdminDashboardProps) {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [centres, setCentres] = useState<Centre[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [statsRes, centresRes] = await Promise.all([
        fetch('/api/stats/super-admin', { credentials: 'include' }),
        fetch('/api/centres', { credentials: 'include' }),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      if (centresRes.ok) {
        const centresData = await centresRes.json()
        setCentres(Array.isArray(centresData) ? centresData.slice(0, 5) : (centresData.data || []))
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      toast({ title: 'خطأ في تحميل البيانات', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'إجمالي المراكز',
      value: stats?.totalCentres ?? 0,
      icon: <Building2 className="w-5 h-5" />,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'المراكز النشطة',
      value: stats?.activeCentres ?? 0,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'فترة تجريبية',
      value: stats?.trialCentres ?? 0,
      icon: <Clock className="w-5 h-5" />,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    {
      title: 'منتهية الصلاحية',
      value: stats?.expiredCentres ?? 0,
      icon: <AlertTriangle className="w-5 h-5" />,
      color: 'text-red-600',
      bg: 'bg-red-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-muted-foreground text-sm mt-1">نظرة عامة على جميع المراكز التعليمية</p>
        </div>
        <Button
          onClick={() => onNavigate('super-admin-centres')}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          إنشاء مركز جديد
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{card.title}</p>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl font-bold mt-1">{card.value}</p>
                  )}
                </div>
                <div className={`${card.bg} ${card.color} p-3 rounded-xl`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي التلاميذ</p>
                {loading ? (
                  <Skeleton className="h-6 w-12 mt-0.5" />
                ) : (
                  <p className="text-xl font-bold">{stats?.totalStudents ?? 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 text-primary p-2.5 rounded-xl">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">إجمالي الأساتذة</p>
                {loading ? (
                  <Skeleton className="h-6 w-12 mt-0.5" />
                ) : (
                  <p className="text-xl font-bold">{stats?.totalTeachers ?? 0}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Centres */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-lg">أحدث المراكز</CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('super-admin-centres')}
          >
            عرض الكل
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : centres.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>لا توجد مراكز بعد</p>
              <p className="text-sm mt-1">ابدأ بإنشاء مركز جديد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">اسم المركز</TableHead>
                  <TableHead className="text-right">المدير</TableHead>
                  <TableHead className="text-right">المدينة</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {centres.map((centre) => (
                  <TableRow key={centre.id}>
                    <TableCell className="font-medium">{centre.name}</TableCell>
                    <TableCell>{centre.admin?.name || '—'}</TableCell>
                    <TableCell>{centre.city || '—'}</TableCell>
                    <TableCell>{getStatusBadge(getCentreStatus(centre))}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(centre.createdAt).toLocaleDateString('ar-DZ')}
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
