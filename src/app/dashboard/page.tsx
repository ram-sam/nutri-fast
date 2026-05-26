import { createClient } from '@/utils/supabase/server';
import { createMeal, deleteMeal, startFast, endFast, updateCalorieGoal } from '../actions/appActions';
import { signout } from '../auth/actions';
import DashboardCharts from '@/components/DashboardCharts';
import { LogOut, Plus, Trash2, Zap, Trophy, Flame } from 'lucide-react';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Queries paralelas buscando o estado atual do banco
  const [mealsRes, fastsRes, profileRes] = await Promise.all([
    supabase.from('meals').select('*').order('date', { ascending: false }),
    supabase.from('fasts').select('*').order('start_time', { ascending: false }),
    supabase.from('profiles').select('daily_calorie_goal').single(),
  ]);

  const meals = mealsRes.data || [];
  const fasts = fastsRes.data || [];
  const profile = profileRes.data || { daily_calorie_goal: 2000 };

  const activeFast = fasts.find(f => f.end_time === null);
  const completedFasts = fasts.filter(f => f.end_time !== null);

  // Lógica para separar consumo de hoje e barra de progresso
  const startOfToday = new Date();
  startOfToday.setHours(0,0,0,0);
  const todayCalories = meals
    .filter(m => new Date(m.date) >= startOfToday)
    .reduce((sum, m) => sum + m.calories, 0);

  const percentage = Math.min((todayCalories / profile.daily_calorie_goal) * 100, 100);

  // Processamento do Histórico Semanal (Últimos 7 dias) para os Gráficos
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(day => {
    const dayMeals = meals.filter(m => m.date.startsWith(day));
    const dayCal = dayMeals.reduce((sum, m) => sum + m.calories, 0);
    
    const dayFasts = completedFasts.filter(f => f.start_time.startsWith(day));
    const dayFastHours = dayFasts.reduce((sum, f) => {
      const duration = (new Date(f.end_time!).getTime() - new Date(f.start_time).getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);

    return {
      day: new Date(day).toLocaleDateString('pt-BR', { weekday: 'short' }),
      calories: dayCal,
      fastingHours: parseFloat(dayFastHours.toFixed(1))
    };
  });

  // Indicadores Agregados
  const avgCalories = chartData.reduce((acc, curr) => acc + curr.calories, 0) / 7;
  const totalFastsThisWeek = completedFasts.filter(f => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return new Date(f.start_time) >= oneWeekAgo;
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-12 dark:bg-gray-900">
      {/* HEADER */}
      <header className="bg-white shadow-sm dark:bg-gray-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard NutriFast</h1>
          <form action={signout}><button className="flex items-center gap-2 text-red-500 hover:text-red-700"><LogOut size={18} />Sair</button></form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8 space-y-6">
        
        {/* INDICADORES DE METAS E CALORIAS */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800 md:col-span-2">
            <div className="flex justify-between items-center mb-2">
              <h2 className="font-bold text-gray-700 dark:text-gray-300">Meta Calórica Diária</h2>
              <form action={async (fd) => { 'use server'; await updateCalorieGoal(Number(fd.get('goal'))); }} className="flex gap-2">
                <input name="goal" type="number" defaultValue={profile.daily_calorie_goal} className="w-20 rounded border p-1 text-sm text-black" />
                <button type="submit" className="bg-blue-500 text-white text-xs px-2 rounded">Definir</button>
              </form>
            </div>
            <div className="text-3xl font-extrabold text-blue-600">{todayCalories} / <span className="text-gray-400 text-xl font-normal">{profile.daily_calorie_goal} kcal</span></div>
            <div className="w-full bg-gray-200 rounded-full h-4 mt-4 dark:bg-gray-700">
              <div className="bg-blue-600 h-4 rounded-full transition-all duration-300" style={{ width: `${percentage}%` }}></div>
            </div>
          </div>

          {/* CONTROLE DE JEJUM INTERMITENTE */}
          <div className="rounded-xl bg-white p-6 shadow dark:bg-gray-800 flex flex-col justify-between">
            <h2 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2"><Zap size={18} className="text-amber-500"/> Jejum Atual</h2>
            {activeFast ? (
              <div className="my-2">
                <p className="text-sm text-green-500 font-semibold animate-pulse">● Jejum em Andamento</p>
                <p className="text-xs text-gray-400">Iniciado em: {new Date(activeFast.start_time).toLocaleTimeString()}</p>
                <form action={async () => { 'use server'; await endFast(activeFast.id); }} className="mt-4">
                  <button className="w-full bg-red-500 text-white rounded py-2 font-semibold hover:bg-red-600 transition">Encerrar Jejum</button>
                </form>
              </div>
            ) : (
              <form action={async (fd) => { 'use server'; await startFast(fd.get('type') as string); }} className="space-y-3 mt-2">
                <select name="type" className="w-full p-2 rounded border bg-transparent text-gray-700 dark:text-white">
                  <option value="16:8">16:8 (Padrão)</option>
                  <option value="18:6">18:6 (Avançado)</option>
                  <option value="20:4">20:4 (Guerreiro)</option>
                  <option value="24h">24 horas</option>
                </select>
                <button className="w-full bg-emerald-500 text-white rounded py-2 font-semibold hover:bg-emerald-600 transition">Iniciar Jejum</button>
              </form>
            )}
          </div>
        </section>

        {/* COMPONENTE CLIENT-SIDE DE GRÁFICOS */}
        <DashboardCharts chartData={chartData} calorieGoal={profile.daily_calorie_goal} />

        {/* AGREGADOS SEMANAIS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600"><Flame /></div>
            <div>
              <p className="text-sm text-gray-400">Média Calórica Diária</p>
              <h4 className="text-xl font-bold dark:text-white">{Math.round(avgCalories)} kcal</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex items-center gap-4">
            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600"><Trophy /></div>
            <div>
              <p className="text-sm text-gray-400">Jejuns Concluídos (7d)</p>
              <h4 className="text-xl font-bold dark:text-white">{totalFastsThisWeek}</h4>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600"><Zap /></div>
            <div>
              <p className="text-sm text-gray-400">Tempo Médio Concluído</p>
              <h4 className="text-xl font-bold dark:text-white">
                {(completedFasts.reduce((acc, f) => acc + (new Date(f.end_time!).getTime() - new Date(f.start_time).getTime()), 0) / (completedFasts.length || 1) / (1000 * 60 * 60)).toFixed(1)}h
              </h4>
            </div>
          </div>
        </section>

        {/* CRUD DE REFEIÇÕES */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Formulário de Criação */}
          <div className="bg-white p-6 rounded-xl shadow dark:bg-gray-800">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white flex items-center gap-2"><Plus size={18}/> Registrar Refeição</h3>
            <form action={createMeal} className="space-y-3">
              <input type="text" name="description" placeholder="Ex: Arroz, feijão e frango grelhado" required className="w-full p-2 border rounded" />
              <input type="number" name="calories" placeholder="Calorias (kcal)" required className="w-full p-2 border rounded" />
              <select name="type" required className="w-full p-2 border rounded">
                <option value="café">Café da Manhã</option>
                <option value="almoço">Almoço</option>
                <option value="lanche">Lanche</option>
                <option value="jantar">Jantar</option>
                <option value="ceia">Ceia</option>
              </select>
              <input type="datetime-local" name="date" required defaultValue={new Date().toISOString().slice(0,16)} className="w-full p-2 border rounded" />
              <button type="submit" className="w-full bg-blue-600 text-white rounded py-2 font-semibold">Salvar Refeição</button>
            </form>
          </div>

          {/* Histórico e Listagem */}
          <div className="bg-white p-6 rounded-xl shadow dark:bg-gray-800 lg:col-span-2">
            <h3 className="font-bold text-lg mb-4 text-gray-800 dark:text-white">Histórico de Alimentos</h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {meals.length === 0 ? (
                <p className="text-gray-400 text-sm">Nenhum registro encontrado.</p>
              ) : (
                meals.map((meal) => (
                  <div key={meal.id} className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
                    <div>
                      <h4 className="font-semibold text-gray-800 dark:text-white">{meal.description}</h4>
                      <p className="text-xs text-gray-400 capitalize">{meal.type} • {new Date(meal.date).toLocaleDateString('pt-BR')} {new Date(meal.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-blue-500">{meal.calories} kcal</span>
                      <form action={async () => { 'use server'; if(confirm('Deseja excluir este registro?')) await deleteMeal(meal.id); }}>
                        <button className="text-gray-400 hover:text-red-500 transition"><Trash2 size={16} /></button>
                      </form>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER - AVISO ÉTICO E MÉDICO MANDATÓRIO */}
      <footer className="mt-24 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 py-6 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto px-4">
          Aviso: Este sistema é um exercício acadêmico estritamente informativo. O acompanhamento calórico e de rotinas de jejum fornecido não substitui, sob qualquer hipótese, orientação médica, nutricional ou psicológica profissional.
        </div>
      </footer>
    </div>
  );
}