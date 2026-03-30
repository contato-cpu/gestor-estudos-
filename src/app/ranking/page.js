'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';

const FILTROS_PERIODO = ['Semanal', 'Mensal', 'Geral'];

export default function RankingPage() {
  const [periodo, setPeriodo] = useState('Geral');
  const [ranking, setRanking] = useState([]);
  const [meuRanking, setMeuRanking] = useState(null);
  const [totalAlunos, setTotalAlunos] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/ranking?periodo=${periodo.toLowerCase()}&limite=50`);

        if (!response.ok) {
          throw new Error('Erro ao carregar ranking');
        }

        const data = await response.json();
        setRanking(data.ranking || []);
        setMeuRanking(data.minhaPosicao);
        setTotalAlunos(data.totalAlunos || 0);
      } catch (err) {
        console.error('Erro ao buscar ranking:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [periodo]);

  const medalha = (pos) => {
    if (pos === 1) return '🥇';
    if (pos === 2) return '🥈';
    if (pos === 3) return '🥉';
    return `${pos}º`;
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-cs-secondary mb-4"></div>
              <p className="text-slate-600 font-medium">Carregando ranking...</p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || ranking.length === 0) {
    return (
      <AppShell>
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-slate-600 font-medium mb-2">
                {error ? 'Erro ao carregar ranking' : 'Nenhum usuário cadastrado ainda'}
              </p>
              <p className="text-slate-400 text-sm">
                {error ? error : 'Comece a resolver exercícios para aparecer no ranking!'}
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">🏆 Ranking Nacional</h1>
            <p className="text-slate-500 text-sm mt-1">{totalAlunos.toLocaleString('pt-BR')} alunos competindo</p>
          </div>
          <div className="flex gap-2">
            {FILTROS_PERIODO.map(p => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  periodo === p ? 'bg-cs-secondary text-white' : 'bg-white text-slate-600 border hover:bg-slate-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 destaque */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {ranking.slice(0, 3).map((u, i) => (
            <div key={u.posicao} className={`bg-white rounded-xl border-2 p-6 text-center ${
              i === 0 ? 'border-yellow-400 shadow-lg shadow-yellow-100 -mt-2' :
              i === 1 ? 'border-slate-300' : 'border-amber-600'
            }`}>
              <div className="text-4xl mb-2">{medalha(u.posicao)}</div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cs-secondary to-blue-400 mx-auto flex items-center justify-center text-white text-xl font-bold mb-3">
                {u.nome.charAt(0)}
              </div>
              <h3 className="font-bold text-slate-800">{u.nome}</h3>
              <p className="text-2xl font-bold text-cs-secondary">{u.pontos.toLocaleString('pt-BR')}</p>
              <p className="text-xs text-slate-500">pontos</p>
              <div className="flex justify-center gap-4 mt-3 text-xs text-slate-500">
                <span>🎯 {u.percentualAcertos}%</span>
                <span>🔥 {u.sequencia}d</span>
              </div>
            </div>
          ))}
        </div>

        {/* Sua posição */}
        {meuRanking ? (
          <div className="bg-blue-50 border-2 border-cs-secondary rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-lg font-bold text-cs-secondary">#{meuRanking.posicao}</span>
              <div className="w-10 h-10 rounded-full bg-cs-secondary text-white flex items-center justify-center font-bold">
                {meuRanking.nome?.charAt(0) || 'V'}
              </div>
              <div>
                <p className="font-bold text-slate-800">{meuRanking.nome || 'Você'}</p>
                <p className="text-xs text-slate-500">Sua posição atual</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="text-center">
                <p className="font-bold text-cs-secondary">{meuRanking.pontos.toLocaleString('pt-BR')}</p>
                <p className="text-xs text-slate-400">pontos</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-green-600">{meuRanking.percentualAcertos}%</p>
                <p className="text-xs text-slate-400">acertos</p>
              </div>
              <div className="text-center">
                <p className="font-bold text-orange-600">🔥 {meuRanking.sequencia}</p>
                <p className="text-xs text-slate-400">sequência</p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Lista 4+ */}
        {ranking.length > 3 && (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 text-xs text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3 text-left">Posição</th>
                  <th className="px-6 py-3 text-left">Aluno</th>
                  <th className="px-6 py-3 text-right">Pontos</th>
                  <th className="px-6 py-3 text-right">Acertos</th>
                  <th className="px-6 py-3 text-right">Sequência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ranking.slice(3).map(u => (
                  <tr key={u.posicao} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 font-bold text-slate-500">{u.posicao}º</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600">
                          {u.nome.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{u.nome}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-700">{u.pontos.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-right text-green-600 font-medium">{u.percentualAcertos}%</td>
                    <td className="px-6 py-4 text-right text-orange-600 font-medium">🔥 {u.sequencia}d</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
