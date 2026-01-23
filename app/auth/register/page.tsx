import { Metadata } from 'next'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { AuthGuard } from '@/components/auth/AuthGuard'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sign Up - Vibe Coders PM',
  description: 'Create a new Vibe Coders project management account',
}

export default function RegisterPage() {
  return (
    <AuthGuard requireAuth={false}>
      <div className="container flex min-h-screen flex-col items-center justify-center py-12">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple" />
            <h1 className="text-2xl font-bold tracking-tight">Vibe Coders PM</h1>
          </Link>
          <p className="mt-2 text-muted-foreground">
            Create an account to start managing your projects
          </p>
        </div>
        <RegisterForm />
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            By creating an account, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </AuthGuard>
  )
}