'use client';

import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';

export default function QuestoesPage() {
  const [disciplinas, setDisciplinas] = useState([]);
  const [disciplinaFiltro, setDisciplinaFiltro] = useState('todas');
  const [questoes, setQuestoes] = useState([]);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostaSelecionada, setRespostaSelecionada] = useState(null);
  const [confirmada, setConfirmada] = useState(false);
  const [stats, setStats] = useState({ total: 0, acertos: 0 });
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(null);
  const [semQuestoes, setSemQuestoes] = useState(false);

  // Carregar disciplinas ao montar
  useEffect(() => {
    const carregarDisciplinas = async () => {
      try {
        const res = await fetch('/api/disciplinas');
        if (!res.ok) throw new Error('Erro ao carregar disciplinas');
        const data = await res.json();
        setDisciplinas(data.disciplinas || []);
      } catch (err) {
        console.error('Erro ao carregar disciplinas:', err);
        setErro('Erro ao carregar disciplinas');
      }
    };
    carregarDisciplinas();
  }, []);

  // Carregar questões quando disciplina mudar
  useEffect(() => {
    const carregarQuestoes = async () => {
      if (disciplinaFiltro === 'todas') {
        setQuestoes([]);
        setSemQuestoes(false);
        return;
      }

      setCarregando(true);
      setErro(null);
      setSemQuestoes(false);

      try {
        const url = new URL('/api/questoes', window.location.origin);
        url.searchParams.append('disciplina', disciplinaFiltro);
        url.searchParams.append('limite', '10');

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error('Erro ao carregar questões');

        const data = await res.json();
        if (!data.questoes || data.questoes.length === 0) {
          setSemQuestoes(true);
          setQuestoes([]);
        } else {
          setQuestoes(data.questoes);
          setSemQuestoes(false);
        }
      } catch (err) {
        console.error('Erro ao carregar questões:', err);
        setErro('Erro ao carregar questões');
        setQuestoes([]);
      } finally {
        setCarregando(false);
      }

      // Reset state
      setQuestaoAtual(0);
      setConfirmada(false);
      setRespostaSelecionada(null);
    };

    carregarQuestoes();
  }, [disciplinaFiltro]);

  const questao = questoes[questaoAtual];

  const confirmarResposta = async () => {
    if (!respostaSelecionada || !questao) return;

    setCarregando(true);
    try {
      const res = await fetch('/api/questoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questaoId: questao.id,
          letraEscolhida: respostaSelecionada,
        }),
      });

      if (!res.ok) throw new Error('Erro ao registrar resposta');

      const data = await res.json();

      setConfirmada(true);
      setStats(prev => ({
        total: prev.total + 1,
        acertos: prev.acertos + (data.acertou ? 1 : 0),
      }));
    } catch (err) {
      console.error('Erro ao registrar resposta:', err);
      setErro('Erro ao registrar resposta');
    } finally {
      setCarregando(false);
    }
  };

  const proximaQuestao = () => {
    setRespostaSelecionada(null);
    setConfirmada(false);
    setQuestaoAtual(prev => (prev + 1) % questoes.length);
  };

  const corDificuldade = {
    FACIL: 'bg-green-100 text-green-800',
    MEDIO: 'bg-yellow-100 text-yellow-800',
    DIFICIL: 'bg-red-100 text-red-800',
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Resolver Questões</h1>
            <p className="text-slate-500 text-sm mt-1">
              {stats.total > 0
                ? `${stats.acertos}/${stats.total} acertos (${Math.round(stats.acertos/stats.total*100)}%)`
                : 'Selecione uma disciplina e comece'}
            </p>
          </div>

          {/* Filtro */}
          <select
            value={disciplinaFiltro}
            onChange={(e) => setDisciplinaFiltro(e.target.value)}
            disabled={carregando}
            className="bg-white border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-cs-secondary disabled:opacity-50"
          >
            <option value="todas">Todas as disciplinas</option>
            {disciplinas.map(d => (
              <option key={d.slug} value={d.slug}>
                {d.icone} {d.nome}
              </option>
            ))}
          </select>
        </div>

        {/* Erro */}
        {erro && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{erro}</p>
          </div>
        )}

        {/* Carregando */}
        {carregando && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <p className="text-slate-500">Carregando...</p>
          </div>
        )}

        {/* Sem questões */}
        {semQuestoes && !carregando && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-slate-600 font-medium mb-2">Questões não geradas ainda</p>
            <p className="text-slate-500 text-sm">As questões desta disciplina ainda não foram geradas. Volte mais tarde!</p>
          </div>
        )}

        {/* Nenhuma disciplina selecionada */}
        {disciplinaFiltro === 'todas' && !carregando && (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <p className="text-4xl mb-4">📚</p>
            <p className="text-slate-500">Selecione uma disciplina para começar</p>
          </div>
        )}

        {/* Questão Card */}
        {questao && !carregando && !semQuestoes && (
          <>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Questão header */}
              <div className="bg-slate-50 px-6 py-3 flex items-center justify-between border-b">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-500">
                    Questão {questaoAtual + 1}/{questoes.length}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${corDificuldade[questao.dificuldade]}`}>
                    {questao.dificuldade}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>📖 {questao.disciplina.nome}</span>
                  {questao.topico && (
                    <>
                      <span>•</span>
                      <span>{questao.topico.nome}</span>
                    </>
                  )}
                  {questao.paginaRef && (
                    <>
                      <span>•</span>
                      <span>p. {questao.paginaRef}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Enunciado */}
              <div className="p-6">
                <p className="text-lg text-slate-800 leading-relaxed font-medium">
                  {questao.enunciado}
                </p>
              </div>

              {/* Alternativas */}
              <div className="px-6 pb-6 space-y-3">
                {questao.alternativas.map((alt) => {
                  const selecionada = respostaSelecionada === alt.letra;
                  let estilo = 'border-slate-200 hover:border-cs-secondary hover:bg-blue-50';

                  if (confirmada) {
                    if (alt.correta) {
                      estilo = 'border-green-500 bg-green-50 ring-2 ring-green-200';
                    } else if (selecionada && !alt.correta) {
                      estilo = 'border-red-500 bg-red-50 ring-2 ring-red-200';
                    } else {
                      estilo = 'border-slate-200 opacity-50';
                    }
                  } else if (selecionada) {
                    estilo = 'border-cs-secondary bg-blue-50 ring-2 ring-blue-200';
                  }

                  return (
                    <button
                      key={alt.letra}
                      onClick={() => !confirmada && setRespostaSelecionada(alt.letra)}
                      disabled={confirmada || carregando}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${estilo}`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                          selecionada && !confirmada ? 'bg-cs-secondary text-white' :
                          confirmada && alt.correta ? 'bg-green-500 text-white' :
                          confirmada && selecionada ? 'bg-red-500 text-white' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {confirmada && alt.correta ? '✓' : confirmada && selecionada ? '✗' : alt.letra}
                        </span>
                        <span className="text-slate-700 leading-relaxed">{alt.texto}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Botão confirmar */}
              {!confirmada && (
                <div className="px-6 pb-6">
                  <button
                    onClick={confirmarResposta}
                    disabled={!respostaSelecionada || carregando}
                    className="w-full bg-cs-secondary text-white rounded-lg py-3 font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    Confirmar Resposta
                  </button>
                </div>
              )}

              {/* Explicação */}
              {confirmada && (
                <div className="border-t border-slate-200">
                  <div className="p-6 bg-slate-50">
                    <h3 className="font-bold text-slate-800 mb-2">💡 Explicação</h3>
                    <p className="text-slate-600 leading-relaxed">{questao.explicacao}</p>
                  </div>
                  <div className="px-6 pb-6 bg-slate-50">
                    <button
                      onClick={proximaQuestao}
                      className="w-full bg-cs-secondary text-white rounded-lg py-3 font-semibold hover:bg-blue-700 transition"
                    >
                      Próxima Questão →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
