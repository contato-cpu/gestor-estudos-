'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';

export default function EditaisPage() {
  const [editais, setEditais] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editalAberto, setEditalAberto] = useState(null);

  useEffect(() => {
    fetchEditais();
  }, []);

  const fetchEditais = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/editais');
      if (!response.ok) {
        throw new Error('Failed to fetch editais');
      }
      const data = await response.json();
      setEditais(data);
    } catch (err) {
      console.error('Error fetching editais:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">📋 Editais Verticalizados</h1>
          <p className="text-slate-500 text-sm mt-1">Estude focado no edital do seu concurso</p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-cs-secondary mb-4"></div>
              <p className="text-slate-600">Carregando editais...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
            <p className="text-red-800 font-medium">Erro ao carregar editais</p>
            <p className="text-red-600 text-sm mt-1">{error}</p>
            <button
              onClick={fetchEditais}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && editais.length === 0 && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-12 text-center">
            <p className="text-slate-600 text-lg">Nenhum edital disponível no momento</p>
            <p className="text-slate-500 text-sm mt-2">Volte mais tarde para acompanhar novos editais</p>
          </div>
        )}

        {/* Cards de Editais */}
        {!loading && !error && editais.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {editais.map(edital => (
                <button
                  key={edital.id}
                  onClick={() => setEditalAberto(editalAberto === edital.id ? null : edital.id)}
                  className={`text-left bg-white rounded-xl border-2 p-6 transition hover:shadow-md ${
                    editalAberto === edital.id ? 'border-cs-secondary shadow-md' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-cs-primary">{edital.orgao}</span>
                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded">{edital.ano}</span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{edital.cargo}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-full bg-cs-secondary rounded-full"
                        style={{ width: `${edital.progressoGeral}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-cs-secondary">{edital.progressoGeral}%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {edital.disciplinas.length} disciplinas • {edital.disciplinas.reduce((s, d) => s + d.questoesPrevistas, 0)} questões previstas
                  </p>
                </button>
              ))}
            </div>

            {/* Detalhes do Edital */}
            {editalAberto && (() => {
              const edital = editais.find(e => e.id === editalAberto);
              if (!edital) return null;
              return (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-cs-primary text-white px-6 py-4">
                    <h2 className="text-xl font-bold">{edital.nome} — {edital.cargo}</h2>
                    <p className="text-sm text-blue-200 mt-1">Verticalização de conteúdo por disciplina</p>
                  </div>
                  <div className="divide-y divide-slate-100">
                    {edital.disciplinas
                      .sort((a, b) => b.peso - a.peso)
                      .map((disc, idx) => (
                      <div key={idx} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition">
                        <div className="w-8 text-center">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${
                            disc.peso >= 3 ? 'bg-red-100 text-red-700' :
                            disc.peso >= 2 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            P{disc.peso}
                          </span>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-slate-800">{disc.nome}</p>
                          <p className="text-xs text-slate-400">{disc.questoesPrevistas} questões previstas</p>
                        </div>
                        <div className="w-48 flex items-center gap-2">
                          <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                disc.seuProgresso >= 70 ? 'bg-green-500' :
                                disc.seuProgresso >= 40 ? 'bg-yellow-500' :
                                'bg-red-500'
                              }`}
                              style={{ width: `${disc.seuProgresso}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-10 text-right text-slate-600">{disc.seuProgresso}%</span>
                        </div>
                        <button className="bg-cs-secondary text-white text-xs px-3 py-1.5 rounded-lg font-medium hover:bg-blue-700 transition">
                          Estudar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}
      </div>
    </AppShell>
  );
}
