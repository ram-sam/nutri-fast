'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export async function login(formData: FormData) {
  const supabase = await createClient(); // Atualizado com await
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return redirect('/login?error=Credenciais inválidas');
  
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const supabase = await createClient(); // Atualizado com await
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { error } = await supabase.auth.signUp({ email, password });
  if (error) return redirect('/login?error=Erro ao cadastrar');

  redirect('/dashboard');
}

export async function signout() {
  const supabase = await createClient(); // Atualizado com await
  await supabase.auth.signOut();
  redirect('/login');
}