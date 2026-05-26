import { createClient } from '@/utils/supabase/server';
import { createMeal, deleteMeal, startFast, endFast, updateCalorieGoal } from '../actions/appActions';
import { signout } from '../auth/actions';
import DashboardCharts from '@/components/DashboardCharts';
import { LogOut, Plus, Trash2, Zap, Trophy, Flame, Utensils, Calendar } from 'lucide-react';

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

  // Lógica segura para separar consumo de hoje (baseado na data local em formato string YYYY-MM-DD)
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCalories = meals
    .filter(m => m.date && m.date.startsWith(todayStr))
    .reduce((sum, m) => sum + m.calories, 0);

  const percentage = Math.min((todayCalories / profile.daily_calorie_goal) * 100, 100);

  // Processamento do Histórico Semanal (Últimos 7 dias) para os Gráficos
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const chartData = last7Days.map(day => {
    const dayMeals = meals.filter(m => m.date && m.date.startsWith(day));
    const dayCal = dayMeals.reduce((sum, m) => sum + m.calories, 0);
    
    const dayFasts = completedFasts.filter(f => f.start_time && f.start_time.startsWith(day));
    const dayFastHours = dayFasts.reduce((sum, f) => {
      if (!f.end_time) return sum;
      const duration = (new Date(f.end_time).getTime() - new Date(f.start_time).getTime()) / (1000 * 60 * 60);
      return sum + duration;
    }, 0);

    // Formatação de exibição segura para evitar quebra de hidratação (Hydration Error)
    const labelDia = day.split('-')[2] + '/' + day.split('-')[1];

    return {
      day: labelDia,
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
    <div className="min-h-screen bg-slate-50 pb-12 dark:bg-slate-950">
      {/* HEADER */}
      <header className="bg-white border-b border-slate-100 shadow-sm dark:bg-slate-900 dark:border-slate-800">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-black text-sm">🥗</div>
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">NutriFast</h1>
          </div>
          <form action={signout}>
            <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-red-600 transition dark:text-slate-400">
              <LogOut size={16} /> Sair
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* SEÇÃO CARD SUPERIOR: META CALÓRICA & JEJUM */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
          
          {/* META CALÓRICA DIÁRIA */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 md:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
              <h2 className="font-bold text-slate-800 dark:text-slate-200">Meta Calórica Diária</h2>
              
              <form action={async (fd) => {
                'use server';
                const goal = Number(fd.get('goal'));
                if (goal > 0) {
                  await updateCalorieGoal(goal);
                }
              }} className="flex gap-2">
                <input 
                  name="goal" 
                  type="number" 
                  required
                  defaultValue={profile.daily_calorie_goal} 
                  className="w-24 rounded-xl border border-slate-200 bg-slate-50 p-2 text-sm text-slate-900 outline-none focus:border-blue-500 focus:bg-white transition dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
                />
                <button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition active:scale-95 shadow-sm shadow-blue-500/10"
                >
                  Definir
                </button>
              </form>
            </div>
            
            <div>
              <div className="text-3xl font-black text-blue-600 dark:text-blue-500">
                {todayCalories} <span className="text-slate-400 text-xl font-normal dark:text-slate-500">/ {profile.daily_calorie_goal} kcal</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 mt-3 dark:bg-slate-800 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 h-3 rounded-full transition-all duration-500" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* CONTROLE DE JEJUM INTERMITENTE */}
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between">
            <h2 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Zap size={18} className="text-amber-500 fill-amber-500"/> Jejum Monitorado
            </h2>
            
            {activeFast ? (
              <div className="my-2 space-y-3">
                <div className="flex items-center gap-2 text-sm text-emerald-600 font-bold dark:text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                  Em andamento...
                </div>
                <form action={async () => { 'use server'; await endFast(activeFast.id); }}>
                  <button className="w-full bg-red-500 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-red-600 transition active:scale-95 shadow-sm shadow-red-500/10">
                    Encerrar Jejum
                  </button>
                </form>
              </div>
            ) : (
              <form action={async (fd) => { 'use server'; await startFast(fd.get('type') as string); }} className="space-y-3 mt-4">
                <select name="type" className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <option value="16:8">16:8 (Recomendado)</option>
                  <option value="18:6">18:6 (Intermediário)</option>
                  <option value="20:4">20:4 (Guerreiro)</option>
                  <option value="24h">24 horas completo</option>
                </select>
                <button className="w-full bg-slate-900 text-white rounded-xl py-2.5 text-sm font-bold hover:bg-slate-800 transition active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700">
                  Iniciar Janela de Jejum
                </button>
              </form>
            )}
          </div>
        </section>

        {/* COMPONENTE DE GRÁFICOS */}
        <DashboardCharts chartData={chartData} calorieGoal={profile.daily_calorie_goal} />

        {/* METRICAS AGREGADAS */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"><Flame size={24} /></div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Média Calórica</p>
              <h4 className="text-xl font-black text-slate-800 dark:text-white">{Math.round(avgCalories)} kcal</h4>
            </div>
          </div>
          <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400"><Trophy size={24} /></div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Ciclos Concluídos (7d)</p>
              <h4 className="text-xl font-black text-slate-800 dark:text-white">{totalFastsThisWeek}</h4>
            </div>
          </div>
          <div className="bg-white border border-slate-100 dark:border-slate-800 dark:bg-slate-900 p-5 rounded-2xl shadow-sm flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"><Zap size={24} /></div>
            <div>
              <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tempo Médio Concluído</p>
              <h4 className="text-xl font-black text-slate-800 dark:text-white">
                {(completedFasts.reduce((acc, f) => acc + (new Date(f.end_time!).getTime() - new Date(f.start_time).getTime()), 0) / (completedFasts.length || 1) / (1000 * 60 * 60)).toFixed(1)}h
              </h4>
            </div>
          </div>
        </section>

        {/* SEÇÃO DE CADASTROS E LISTAGENS */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Formulário de Criação */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 h-fit">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2">
              <Plus size={18} className="text-blue-600"/> Registrar Refeição
            </h3>
            <form action={createMeal} className="space-y-4">
              <input 
                type="text" 
                name="description" 
                placeholder="Ex: Arroz, feijão e frango grelhado" 
                required 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
              />
              <input 
                type="number" 
                name="calories" 
                placeholder="Calorias (kcal)" 
                required 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
              />
              <select 
                name="type" 
                required 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <option value="café">Café da Manhã</option>
                <option value="almoço">Almoço</option>
                <option value="lanche">Lanche</option>
                <option value="jantar">Jantar</option>
                <option value="ceia">Ceia</option>
              </select>
              <input 
                type="datetime-local" 
                name="date" 
                required 
                defaultValue={new Date().toISOString().slice(0,16)} 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 focus:bg-white transition dark:border-slate-700 dark:bg-slate-800 dark:text-white" 
              />
              <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-3 font-bold text-sm hover:bg-blue-700 transition active:scale-95 shadow-md shadow-blue-500/10">
                Salvar Refeição
              </button>
            </form>
          </div>

          {/* Histórico de Alimentos */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800 lg:col-span-2">
            <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2">
              <Utensils size={18} className="text-slate-400"/> Histórico de Alimentos (CRUD)
            </h3>
            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-2">
              {meals.length === 0 ? (
                <p className="text-slate-400 text-sm py-4">Nenhum alimento registrado ainda.</p>
              ) : (
                meals.map((meal) => {
                  // Extração estática e segura da data para evitar Hydration Error na nuvem
                  const dataFormatada = meal.date ? meal.date.split('T')[0].split('-').reverse().join('/') : '';
                  
                  return (
                    <div key={meal.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition dark:bg-slate-800/40 dark:hover:bg-slate-800/80">
                      <div>
                        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">{meal.description}</h4>
                        <p className="text-xs text-slate-400 capitalize mt-0.5">{meal.type} • {dataFormatada}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-sm text-blue-600 dark:text-blue-400">{meal.calories} kcal</span>
                        
                        <form action={async () => { 'use server'; await deleteMeal(meal.id); }}>
                          <button 
                            type="submit" 
                            onClick={(e) => {
                              if (!confirm('Deseja realmente remover esta refeição permanentemente do seu relatório?')) {
                                e.preventDefault();
                              }
                            }}
                            className="text-slate-300 hover:text-red-500 transition p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 size={15} />
                          </button>
                        </form>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* HISTÓRICO DE JEJUNS COMPLEMENTAR */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
          <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2">
            <Calendar size={18} className="text-amber-500"/> Histórico de Ciclos de Jejum Concluídos
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[250px] overflow-y-auto pr-2">
            {completedFasts.length === 0 ? (
              <p className="text-slate-400 text-sm py-2 col-span-full">Nenhum ciclo de jejum encerrado registrado no histórico.</p>
            ) : (
              completedFasts.map((fast) => {
                const hours = (new Date(fast.end_time!).getTime() - new Date(fast.start_time).getTime()) / (1000 * 60 * 60);
                const dataInicio = fast.start_time ? fast.start_time.split('T')[0].split('-').reverse().join('/') : '';
                
                return (
                  <div key={fast.id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                    <div className="flex justify-between items-start">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 uppercase tracking-wide">
                        Meta {fast.planned_type}
                      </span>
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300">
                        {hours.toFixed(1)} horas
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-slate-400 space-y-0.5">
                      <p>Data: {dataInicio}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="mt-24 border-t border-slate-100 bg-white dark:bg-slate-900 dark:border-slate-800 py-8 text-center text-xs text-slate-400 dark:text-slate-500">
        <div className="max-w-7xl mx-auto px-4 leading-relaxed">
          Aviso Importante: Este sistema operacional constitui um exercício prático puramente acadêmico de caráter informativo. O monitoramento de balanço energético e rotinas de jejum aqui dispostos não substituem, sob nenhuma hipótese, diagnósticos, pareceres, triagens ou acompanhamentos médicos, nutricionais e psicológicos especializados.
        </div>
      </footer>
    </div>
  );
}