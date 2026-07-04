import Link from 'next/link'
import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Entrar — PRG System',
}

export default function LoginPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-amber-400 mb-2">PRG System</h1>
        <p className="text-slate-400">Entre na sua sessão</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-slate-100 mb-6">Entrar</h2>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-slate-400">
          Não tem uma conta?{' '}
          <Link href="/register" className="text-amber-400 hover:text-amber-300 transition-colors">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
