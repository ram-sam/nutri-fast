'use client'; // <-- Isso avisa ao Next.js que a página pode ter eventos como onSubmit

import Link from 'next/link';

export default function RecoveryPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-xl border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Recuperar Senha</h2>
          <p className="text-xs text-slate-500">Insira seu e-mail para receber as instruções de redefinição</p>
        </div>

        {/* Formulário interativo client-side */}
        <form 
          className="space-y-4" 
          onSubmit={(e) => { 
            e.preventDefault(); 
            alert('Link de redefinição enviado com sucesso para o e-mail informado!'); 
          }}
        >
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">E-mail Cadastrado</label>
            <input 
              type="email" 
              required 
              placeholder="seu@email.com" 
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          
          <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 text-sm rounded-xl transition">
            Enviar Link de Redefinição
          </button>
        </form>

        <div className="text-center">
          <Link href="/login" className="text-xs text-blue-600 hover:underline">Voltar para o Login</Link>
        </div>
      </div>
    </div>
  );
}