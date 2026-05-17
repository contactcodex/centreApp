'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { GraduationCap, Eye, EyeOff, Loader2 } from 'lucide-react'

interface LoginFormProps {
  onLogin: (session: SessionData) => void
}

export interface SessionData {
  user: {
    id: string
    email: string
    name: string
    role: string
    centreId?: string | null
    centreName?: string | null
  }
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // Use NextAuth's official signIn function - handles CSRF and cookies properly
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
        return
      }

      // Small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 300))

      // Verify session after signin
      const session = await getSession()
      if (session?.user) {
        onLogin(session as SessionData)
        return
      }

      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
    } catch {
      setError('حدث خطأ أثناء تسجيل الدخول. يرجى المحاولة مرة أخرى.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-amber-50/30 to-emerald-50 p-4" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary text-primary-foreground mb-4 shadow-lg">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-1">إدارة المراكز التعليمية</h1>
          <p className="text-muted-foreground">قم بتسجيل الدخول للمتابعة</p>
        </div>

        <Card className="shadow-xl border-0 shadow-emerald-500/5">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
            <CardDescription>أدخل بيانات حسابك للوصول إلى لوحة التحكم</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg text-center">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="text-right"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="text-left pl-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-11 text-base font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin ml-2" />
                    جاري تسجيل الدخول...
                  </>
                ) : (
                  'تسجيل الدخول'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          نظام إدارة المراكز التعليمية © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
