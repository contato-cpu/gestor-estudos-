'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (!response.ok) {
          throw new Error('Erro ao carregar dados do dashboard');
        }
        const data = await response.json();
        setStats(data.stats);
        setDisciplinas(data.progresso || []);
      } catch (err) {
        console.error('Erro ao buscar dados do dashboard:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Bom dia, Aluno! 👋</h1>
            <p className="text-slate-500 mt-1">Carregando seus dados...</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !stats) {
    return (
      <AppShell>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-slate-800">Bom dia, Aluno! 👋</h1>
            <p className="text-slate-500 mt-1">Erro ao carregar os dados. Tente novamente mais tarde.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const percentualAcertos = stats.questoesHoje > 0
    ? Math.round((stats.acertosHoje / stats.questoesHoje) * 100)
    : 0;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800">Bom dia, Aluno! 👋</h1>
          <p className="text-slate-500 mt-1">Veja seu progresso e continue seus estudos.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon="🎯"
            label="Questões Hoje"
            value={stats.questoesHoje}
            detail={`${stats.acertosHoje} acertos (${percentualAcertos}%)`}
            color="bg-blue-50 text-blue-700"
          />
          <StatCard
            icon="🔥"
            label="Sequência"
            value={`${stats.sequencia} dias`}
            detail="Continue assim!"
            color="bg-orange-50 text-orange-700"
          />
          <StatCard
            icon="🏆"
            label="Ranking"
            value={`#${stats.posicaoRanking}`}
            detail={`de ${stats.totalAlunos.toLocaleString('pt-BR')} alunos`}
            color="bg-yellow-50 text-yellow-700"
          />
          <StatCard
            icon="📚"
            label="Banco de Questões"
            value={stats.totalQuestoes.toLocaleString('pt-BR')}
            detail="questões disponíveis"
            color="bg-green-50 text-green-700"
          />
        </div>

        {/* Ações Rápidas + Progresso */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ações */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Iniciar Estudo</h2>
            <div className="space-y-3">
              <Link href="/questoes" className="block w-full bg-cs-secondary text-white rounded-lg px-4 py-3 text-center font-semibold hover:bg-blue-700 transition">
                ❓ Resolver Questões
              </Link>
              <Link href="/questoes?modo=revisao" className="block w-full bg-slate-100 text-slate-700 rounded-lg px-4 py-3 text-center font-semibold hover:bg-slate-200 transition">
                🔄 Revisão de Erros
              </Link>
              <Link href="/questoes?modo=simulado" className="block w-full bg-slate-100 text-slate-700 rounded-lg px-4 py-3 text-center font-semibold hover:bg-slate-200 transition">
                📝 Simulado Personalizado
              </Link>
              <Link href="/editais" className="block w-full bg-slate-100 text-slate-700 rounded-lg px-4 py-3 text-center font-semibold hover:bg-slate-200 transition">
                📋 Estudar por Edital
              </Link>
            </div>
          </div>

          {/* Progresso por Disciplina */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Progresso por Disciplina</h2>
              <Link href="/desempenho" className="text-sm text-cs-secondary hover:underline">Ver tudo →</Link>
            </div>
            <div className="space-y-4">
              {disciplinas.map((d) => {
                const progresso = d.totalRespondidas > 0
                  ? Math.round((d.totalAcertos / d.totalRespondidas) * 100)
                  : 0;

                return (
                  <div key={d.id} className="flex items-center gap-4">
                    <div className="w-32 text-sm font-medium text-slate-700 truncate">
                      {d.icone} {d.nome}
                    </div>
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${progresso}%`, backgroundColor: d.cor }}
                      />
                    </div>
                    <div className="w-16 text-right text-sm font-semibold" style={{ color: d.cor }}>
                      {progresso}%
                    </div>
                    <div className="w-24 text-right text-xs text-slate-400">
                      {d.totalRespondidas} questões
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ icon, label, value, detail, color }) {
  return (
    <div className={`rounded-xl p-6 ${color} border border-current/10`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs opacity-60 mt-1">{detail}</p>
    </div>
  );
}
