'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';

export default function DesempenhoPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/desempenho');

        if (!response.ok) {
          throw new Error('Failed to fetch data');
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
            <h1 className="text-2xl font-bold text-slate-800">📊 Desempenho</h1>
            <p className="text-slate-500 text-sm mt-1">Acompanhe sua evolução nos estudos</p>
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
            <h1 className="text-2xl font-bold text-slate-800">📊 Desempenho</h1>
            <p className="text-slate-500 text-sm mt-1">Acompanhe sua evolução nos estudos</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">Erro ao carregar dados: {error || 'Dados não disponíveis'}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const { stats, evolucaoSemanal, desempenhoDisc } = data;
  const maxQuestoes = Math.max(...evolucaoSemanal.map(s => s.questoes), 1);

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">📊 Desempenho</h1>
          <p className="text-slate-500 text-sm mt-1">Acompanhe sua evolução nos estudos</p>
        </div>

        {/* Stats gerais */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-slate-500">Total de Questões</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{stats.totalRespondidas}</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-slate-500">Acertos Totais</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{stats.totalAcertos}</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-slate-500">Média Geral</p>
            <p className="text-3xl font-bold text-cs-secondary mt-1">{stats.mediaGeral}%</p>
          </div>
          <div className="bg-white rounded-xl border p-5">
            <p className="text-sm text-slate-500">Sequência de Dias</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{stats.sequencia}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Evolução semanal (gráfico de barras CSS) */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Evolução Semanal</h2>
            <div className="flex items-end gap-3 h-48">
              {evolucaoSemanal.map((s, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-green-600">{s.acertos}</span>
                  <div className="w-full flex flex-col items-center gap-0.5">
                    <div
                      className="w-full bg-blue-200 rounded-t"
                      style={{ height: `${(s.questoes / maxQuestoes) * 140}px` }}
                    >
                      <div
                        className="w-full bg-cs-secondary rounded-t"
                        style={{ height: s.questoes > 0 ? `${(s.acertos / s.questoes) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">{s.semana}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-cs-secondary rounded" /> Acertos</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 rounded" /> Total</span>
            </div>
          </div>

          {/* Disciplinas — pontos fracos e fortes */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4">Desempenho por Disciplina</h2>
            <div className="space-y-3">
              {desempenhoDisc.length > 0 ? (
                desempenhoDisc.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-28 text-sm font-medium text-slate-700 truncate">{d.nome}</div>
                    <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden relative">
                      <div
                        className={`h-full rounded-full transition-all ${
                          d.perc >= 70 ? 'bg-green-500' :
                          d.perc >= 50 ? 'bg-yellow-500' :
                          d.perc >= 30 ? 'bg-orange-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${d.perc}%` }}
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white drop-shadow">
                        {d.acertos}/{d.total}
                      </span>
                    </div>
                    <div className={`w-12 text-right text-sm font-bold ${
                      d.perc >= 70 ? 'text-green-600' :
                      d.perc >= 50 ? 'text-yellow-600' :
                      d.perc >= 30 ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      {d.perc}%
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">Sem dados de desempenho ainda</p>
              )}
            </div>
          </div>
        </div>

        {/* Análise IA */}
        <div className="mt-6 bg-gradient-to-r from-cs-primary to-cs-secondary rounded-xl p-6 text-white">
          <h2 className="text-lg font-bold mb-3">🤖 Análise Inteligente</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-lg p-4">
              <p className="font-semibold text-green-300 mb-1">✅ Pontos Fortes</p>
              <p className="text-sm text-white/80">
                {desempenhoDisc.length > 0
                  ? `${desempenhoDisc.filter(d => d.perc >= 70).map(d => d.nome).slice(0, 2).join(' e ')} ${desempenhoDisc.filter(d => d.perc >= 70).length > 0 ? 'estão acima de 70%' : 'Continue estudando'}`
                  : 'Complete algumas questões para análise'
                }
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="font-semibold text-red-300 mb-1">⚠️ Atenção</p>
              <p className="text-sm text-white/80">
                {desempenhoDisc.length > 0
                  ? `${desempenhoDisc.filter(d => d.perc < 50).map(d => d.nome).slice(0, 2).join(' e ')} ${desempenhoDisc.filter(d => d.perc < 50).length > 0 ? 'precisam de mais dedicação' : 'Continue praticando'}`
                  : 'Comece a responder questões'
                }
              </p>
            </div>
            <div className="bg-white/10 rounded-lg p-4">
              <p className="font-semibold text-yellow-300 mb-1">📈 Tendência</p>
              <p className="text-sm text-white/80">
                {stats.totalRespondidas > 0
                  ? `Você respondeu ${stats.totalRespondidas} questão${stats.totalRespondidas !== 1 ? 's' : ''} com ${stats.mediaGeral}% de acerto. Mantenha a consistência!`
                  : 'Comece seus estudos para gerar análise'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
