'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const mealSchema = z.object({
  description: z.string().min(2, "Descrição muito curta"),
  calories: z.number().positive("Calorias devem ser maiores que zero"),
  type: z.enum(['café', 'almoço', 'lanche', 'jantar', 'ceia']),
  date: z.string(),
});

export async function createMeal(formData: FormData) {
  const supabase = await createClient(); // Atualizado com await
  const rawData = {
    description: formData.get('description') as string,
    calories: Number(formData.get('calories')),
    type: formData.get('type') as any,
    date: formData.get('date') as string,
  };

  const validated = mealSchema.parse(rawData);
  
  const { error } = await supabase.from('meals').insert([{
    ...validated,
    date: new Date(validated.date).toISOString()
  }]);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
}

export async function updateMeal(id: string, formData: FormData) {
  const supabase = await createClient(); // Atualizado com await
  const rawData = {
    description: formData.get('description') as string,
    calories: Number(formData.get('calories')),
    type: formData.get('type') as any,
    date: formData.get('date') as string,
  };

  const validated = mealSchema.parse(rawData);

  const { error } = await supabase.from('meals').update({
    ...validated,
    date: new Date(validated.date).toISOString()
  }).eq('id', id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
}

export async function deleteMeal(id: string) {
  const supabase = await createClient(); // Atualizado com await
  const { error } = await supabase.from('meals').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
}

export async function updateCalorieGoal(goal: number) {
  const supabase = await createClient(); // Atualizado com await
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  const { error } = await supabase.from('profiles').update({
    daily_calorie_goal: goal,
    updated_at: new Date().toISOString()
  }).eq('id', user.id);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
}

export async function startFast(plannedType: string) {
  const supabase = await createClient(); // Atualizado com await
  const { error } = await supabase.from('fasts').insert([{
    start_time: new Date().toISOString(),
    planned_type: plannedType
  }]);

  if (error) throw new Error("Erro ao iniciar jejum.");
  revalidatePath('/dashboard');
}

export async function endFast(activeFastId: string) {
  const supabase = await createClient(); // Atualizado com await
  const { error } = await supabase.from('fasts').update({
    end_time: new Date().toISOString()
  }).eq('id', activeFastId);

  if (error) throw new Error(error.message);
  revalidatePath('/dashboard');
}