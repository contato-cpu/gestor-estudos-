'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin');

        if (response.status === 403) {
          const result = await response.json();
          setError(result.error || 'Acesso restrito ao administrador');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch admin data');
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">⚙️ Painel Admin</h1>
            <p className="text-slate-500 text-sm mt-1">Gerenciamento da plataforma</p>
          </div>
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-cs-secondary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-slate-500">Carregando dados...</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !data) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">⚙️ Painel Admin</h1>
            <p className="text-slate-500 text-sm mt-1">Gerenciamento da plataforma</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Erro ao carregar dados: {error || 'Dados não disponíveis'}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const { summary, questoesPerDisciplina, recentUsers, recentActivity, quickStats } = data;

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">⚙️ Painel Admin</h1>
          <p className="text-slate-500 text-sm mt-1">Gerenciamento da plataforma</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Usuários</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{summary.totalUsers}</p>
              </div>
              <div className="text-4xl opacity-20">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Questões</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{summary.totalQuestoes}</p>
              </div>
              <div className="text-4xl opacity-20">❓</div>
            </div>
          </div>

          <div className="bg-white rounded-xl border p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">Total de Respostas</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{summary.totalRespostas}</p>
              </div>
              <div className="text-4xl opacity-20">✅</div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {quickStats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6 shadow-sm">
              <p className="text-sm text-blue-700 font-semibold">Acurácia Média</p>
              <p className="text-3xl font-bold text-blue-900 mt-2">{quickStats.averageAccuracy}%</p>
              <p className="text-xs text-blue-600 mt-2">Todos os usuários</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 p-6 shadow-sm">
              <p className="text-sm text-emerald-700 font-semibold">Disciplina Mais Popular</p>
              <p className="text-lg font-bold text-emerald-900 mt-2">{quickStats.mostPopularDiscipline}</p>
              <p className="text-xs text-emerald-600 mt-2">Mais respostas</p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-6 shadow-sm">
              <p className="text-sm text-red-700 font-semibold">Disciplina Mais Difícil</p>
              <p className="text-lg font-bold text-red-900 mt-2">{quickStats.mostDifficultDiscipline}</p>
              <p className="text-xs text-red-600 mt-2">Menor acurácia</p>
            </div>
          </div>
        )}

        {/* All 29 Disciplines with question counts and visual bars */}
        <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-4">Todas as Disciplinas (29)</h2>
          <div className="space-y-3">
            {questoesPerDisciplina.length > 0 ? (
              questoesPerDisciplina.map((item, i) => {
                const maxCount = Math.max(...questoesPerDisciplina.map(d => d.count), 1);
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{item.disciplina}</span>
                      <span className="text-sm font-bold text-cs-secondary">{item.count} questões</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-cs-secondary h-full rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-slate-500 py-4">Nenhuma disciplina com questões</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activity Feed */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Atividade Recente</h2>
            <div className="space-y-3">
              {recentActivity && recentActivity.length > 0 ? (
                recentActivity.map((activity, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b last:border-b-0 hover:bg-slate-50 p-2 rounded transition">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                      activity.acertou ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {activity.acertou ? '✓' : '✗'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">{activity.userName}</p>
                      <p className="text-xs text-slate-500">{activity.discipline}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(activity.createdAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-slate-500 py-4">Nenhuma atividade recente</p>
              )}
            </div>
          </div>

          {/* Registros Recentes */}
          <div className="bg-white rounded-xl border shadow-sm p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Usuários Recentes</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-slate-50">
                  <tr>
                    <th className="text-left py-3 px-3 font-semibold text-slate-700">Nome</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-700">Email</th>
                    <th className="text-left py-3 px-3 font-semibold text-slate-700">Plano</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {recentUsers.length > 0 ? (
                    recentUsers.map((user, i) => (
                      <tr key={i} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-3 text-slate-700 font-medium">{user.nome}</td>
                        <td className="py-3 px-3 text-slate-600 text-xs">{user.email}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            user.plano === 'PREMIUM' ? 'bg-purple-100 text-purple-700' :
                            user.plano === 'PRO' ? 'bg-blue-100 text-blue-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {user.plano}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="py-4 px-3 text-center text-slate-500">
                        Nenhum usuário registrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
