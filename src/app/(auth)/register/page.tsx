import Link from 'next/link'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Criar conta — PRG System',
}

export default function RegisterPage() {
  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-amber-400 mb-2">PRG System</h1>
        <p className="text-slate-400">Crie sua conta de aventureiro</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
        <h2 className="text-xl font-semibold text-slate-100 mb-6">Criar conta</h2>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-slate-400">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
