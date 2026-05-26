import { login, signup } from '../auth/actions';

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 dark:from-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md space-y-8 rounded-2xl bg-white p-10 shadow-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
        
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white font-black text-xl shadow-lg shadow-blue-500/20">
            🥗
          </div>
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">NutriFast</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie sua saúde de forma simples e neutra</p>
        </div>

        {searchParams.error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-700 animate-shake">
            ⚠️ {searchParams.error}
          </div>
        )}

        <form className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">E-mail</label>
            <input 
              name="email" 
              type="email" 
              placeholder="seu@email.com"
              required 
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
            />
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Senha</label>
            <input 
              name="password" 
              type="password" 
              placeholder="••••••••"
              required 
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
            />
          </div>

          <div className="text-right mt-1">
  <a href="/recovery" className="text-xs text-slate-400 hover:text-blue-500 transition">Esqueceu sua senha?</a>
</div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button 
              formAction={login} 
              className="w-full rounded-xl bg-blue-600 py-3 font-bold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 active:scale-95"
            >
              Entrar
            </button>
            <button 
              formAction={signup} 
              className="w-full rounded-xl border border-slate-200 bg-white py-3 font-bold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Criar Conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}