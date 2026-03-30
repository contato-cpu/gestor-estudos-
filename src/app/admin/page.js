'use client';
import { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('dashboard'); // dashboard, upload, editais

  // Upload PDF state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDisciplina, setUploadDisciplina] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploadError, setUploadError] = useState(null);
  const [disciplinas, setDisciplinas] = useState([]);

  // Editais state
  const [editais, setEditais] = useState([]);
  const [editaisLoading, setEditaisLoading] = useState(false);
  const [novoEdital, setNovoEdital] = useState({ nome: '', orgao: '', ano: '2025', cargo: 'Juiz Substituto', disciplinaIds: [] });
  const [criandoEdital, setCriandoEdital] = useState(false);

  useEffect(() => {
    fetchDashboard();
    fetchDisciplinas();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin');
      if (response.status === 403) {
        setError('Acesso restrito ao administrador');
        return;
      }
      if (!response.ok) throw new Error('Erro ao carregar dados');
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisciplinas = async () => {
    try {
      const res = await fetch('/api/disciplinas');
      if (res.ok) {
        const data = await res.json();
        setDisciplinas(data.disciplinas || data);
      }
    } catch (e) { /* ignorar */ }
  };

  const fetchEditais = async () => {
    try {
      setEditaisLoading(true);
      const res = await fetch('/api/admin/editais');
      if (res.ok) {
        const data = await res.json();
        setEditais(data.editais || []);
        if (data.disciplinas) setDisciplinas(data.disciplinas);
      }
    } catch (e) { /* ignorar */ }
    finally { setEditaisLoading(false); }
  };

  // Upload PDF
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile || !uploadDisciplina) return;

    setUploading(true);
    setUploadResult(null);
    setUploadError(null);

    const formData = new FormData();
    formData.append('pdf', uploadFile);
    formData.append('disciplinaId', uploadDisciplina);

    try {
      const res = await fetch('/api/admin/upload-pdf', {
        method: 'POST',
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        setUploadResult(result);
        setUploadFile(null);
        fetchDashboard(); // Atualizar contadores
      } else {
        setUploadError(result.error);
      }
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  };

  // Criar Edital
  const handleCriarEdital = async (e) => {
    e.preventDefault();
    setCriandoEdital(true);
    try {
      const res = await fetch('/api/admin/editais', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(novoEdital),
      });
      const result = await res.json();
      if (res.ok) {
        setNovoEdital({ nome: '', orgao: '', ano: '2025', cargo: 'Juiz Substituto', disciplinaIds: [] });
        fetchEditais();
      }
    } catch (err) { /* ignorar */ }
    finally { setCriandoEdital(false); }
  };

  // Deletar Edital
  const handleDeletarEdital = async (id) => {
    if (!confirm('Tem certeza que deseja excluir este edital?')) return;
    try {
      await fetch(`/api/admin/editais?id=${id}`, { method: 'DELETE' });
      fetchEditais();
    } catch (e) { /* ignorar */ }
  };

  // Toggle disciplina no novo edital
  const toggleDisciplinaEdital = (id) => {
    setNovoEdital(prev => ({
      ...prev,
      disciplinaIds: prev.disciplinaIds.includes(id)
        ? prev.disciplinaIds.filter(d => d !== id)
        : [...prev.disciplinaIds, id],
    }));
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Painel Admin</h1>
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-cs-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-slate-800 mb-4">Painel Admin</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const { summary, questoesPerDisciplina, recentUsers, recentActivity, quickStats } = data || {};

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Painel Admin</h1>
          <p className="text-slate-500 text-sm mt-1">Gerenciamento completo da plataforma</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 rounded-lg p-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'upload', label: 'Upload PDFs', icon: '📄' },
            { id: 'editais', label: 'Editais', icon: '📋' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); if (t.id === 'editais') fetchEditais(); }}
              className={`flex-1 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                tab === t.id
                  ? 'bg-white text-cs-secondary shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* TAB: Dashboard */}
        {tab === 'dashboard' && summary && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl border p-6 shadow-sm">
                <p className="text-sm text-slate-500">Total de Alunos</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{summary.totalUsers}</p>
              </div>
              <div className="bg-white rounded-xl border p-6 shadow-sm">
                <p className="text-sm text-slate-500">Total de Questoes</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{summary.totalQuestoes}</p>
              </div>
              <div className="bg-white rounded-xl border p-6 shadow-sm">
                <p className="text-sm text-slate-500">Total de Respostas</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{summary.totalRespostas}</p>
              </div>
            </div>

            {quickStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 p-6">
                  <p className="text-sm text-blue-700 font-semibold">Acuracia Media</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{quickStats.averageAccuracy}%</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl border border-emerald-200 p-6">
                  <p className="text-sm text-emerald-700 font-semibold">Disciplina Mais Popular</p>
                  <p className="text-lg font-bold text-emerald-900 mt-2">{quickStats.mostPopularDiscipline}</p>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl border border-red-200 p-6">
                  <p className="text-sm text-red-700 font-semibold">Mais Dificil</p>
                  <p className="text-lg font-bold text-red-900 mt-2">{quickStats.mostDifficultDiscipline}</p>
                </div>
              </div>
            )}

            <div className="bg-white rounded-xl border shadow-sm p-6 mb-8">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Questoes por Disciplina</h2>
              <div className="space-y-3">
                {questoesPerDisciplina && questoesPerDisciplina.length > 0 ? (
                  questoesPerDisciplina.map((item, i) => {
                    const maxCount = Math.max(...questoesPerDisciplina.map(d => d.count), 1);
                    const pct = (item.count / maxCount) * 100;
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-slate-700">{item.disciplina}</span>
                          <span className="text-sm font-bold text-cs-secondary">{item.count}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-cs-secondary h-full rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-slate-500 py-4">Nenhuma questao ainda</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Atividade Recente</h2>
                <div className="space-y-3">
                  {recentActivity && recentActivity.length > 0 ? recentActivity.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b last:border-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        a.acertou ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {a.acertou ? '✓' : '✗'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">{a.userName}</p>
                        <p className="text-xs text-slate-500">{a.discipline}</p>
                      </div>
                    </div>
                  )) : <p className="text-slate-500 text-center py-4">Nenhuma atividade</p>}
                </div>
              </div>

              <div className="bg-white rounded-xl border shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-800 mb-4">Alunos Recentes</h2>
                <div className="space-y-2">
                  {recentUsers && recentUsers.length > 0 ? recentUsers.map((u, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{u.nome}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        u.plano === 'PREMIUM' ? 'bg-purple-100 text-purple-700' :
                        u.plano === 'PRO' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                      }`}>{u.plano}</span>
                    </div>
                  )) : <p className="text-slate-500 text-center py-4">Nenhum aluno</p>}
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB: Upload PDFs */}
        {tab === 'upload' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Upload de PDF para Gerar Questoes</h2>
              <p className="text-slate-500 text-sm mb-6">
                Faca upload de um PDF de caderno sistematizado. O sistema extrai o texto e gera questoes automaticamente com IA.
              </p>

              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Disciplina *</label>
                  <select
                    value={uploadDisciplina}
                    onChange={e => setUploadDisciplina(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-cs-secondary focus:border-cs-secondary"
                    required
                  >
                    <option value="">Selecione a disciplina...</option>
                    {disciplinas.map(d => (
                      <option key={d.id} value={d.id}>{d.nome}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Arquivo PDF *</label>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-cs-secondary transition-colors">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={e => setUploadFile(e.target.files[0])}
                      className="hidden"
                      id="pdf-input"
                    />
                    <label htmlFor="pdf-input" className="cursor-pointer">
                      {uploadFile ? (
                        <div>
                          <p className="text-lg font-medium text-cs-secondary">{uploadFile.name}</p>
                          <p className="text-sm text-slate-500 mt-1">{(uploadFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                      ) : (
                        <div>
                          <p className="text-4xl mb-2">📄</p>
                          <p className="text-sm text-slate-600">Clique para selecionar um PDF</p>
                          <p className="text-xs text-slate-400 mt-1">ou arraste e solte aqui</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading || !uploadFile || !uploadDisciplina}
                  className="w-full bg-cs-secondary text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      Processando PDF e gerando questoes... (pode demorar alguns minutos)
                    </span>
                  ) : (
                    'Enviar PDF e Gerar Questoes'
                  )}
                </button>
              </form>

              {uploadError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-700 text-sm">{uploadError}</p>
                </div>
              )}

              {uploadResult && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-bold text-green-800 mb-2">Upload concluido!</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-700">{uploadResult.totalQuestoes}</p>
                      <p className="text-xs text-slate-500">Questoes geradas</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700">{uploadResult.caderno?.paginas}</p>
                      <p className="text-xs text-slate-500">Paginas</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-purple-700">{uploadResult.blocos}</p>
                      <p className="text-xs text-slate-500">Blocos processados</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-slate-700">{(uploadResult.caderno?.chars / 1000).toFixed(0)}k</p>
                      <p className="text-xs text-slate-500">Caracteres</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cadernos já processados */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Cadernos Processados</h2>
              {questoesPerDisciplina && questoesPerDisciplina.filter(d => d.count > 0).length > 0 ? (
                <div className="space-y-2">
                  {questoesPerDisciplina.filter(d => d.count > 0).map((d, i) => (
                    <div key={i} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-700">{d.disciplina}</span>
                      <span className="text-sm font-bold text-cs-secondary">{d.count} questoes</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">Nenhum caderno processado ainda. Faca o upload acima!</p>
              )}
            </div>
          </div>
        )}

        {/* TAB: Editais */}
        {tab === 'editais' && (
          <div className="space-y-6">
            {/* Criar novo edital */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Criar Novo Edital</h2>
              <form onSubmit={handleCriarEdital} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome do Edital *</label>
                    <input
                      type="text"
                      value={novoEdital.nome}
                      onChange={e => setNovoEdital(p => ({ ...p, nome: e.target.value }))}
                      placeholder="Ex: TJ-SP 2025"
                      className="w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-cs-secondary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Orgao *</label>
                    <input
                      type="text"
                      value={novoEdital.orgao}
                      onChange={e => setNovoEdital(p => ({ ...p, orgao: e.target.value }))}
                      placeholder="Ex: TJ-SP"
                      className="w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-cs-secondary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Ano *</label>
                    <input
                      type="number"
                      value={novoEdital.ano}
                      onChange={e => setNovoEdital(p => ({ ...p, ano: e.target.value }))}
                      className="w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-cs-secondary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cargo</label>
                    <input
                      type="text"
                      value={novoEdital.cargo}
                      onChange={e => setNovoEdital(p => ({ ...p, cargo: e.target.value }))}
                      className="w-full border rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-cs-secondary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Disciplinas do Edital ({novoEdital.disciplinaIds.length} selecionadas)
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {disciplinas.map(d => (
                      <label
                        key={d.id}
                        className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer text-sm transition ${
                          novoEdital.disciplinaIds.includes(d.id)
                            ? 'bg-cs-secondary bg-opacity-10 text-cs-secondary font-medium'
                            : 'hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={novoEdital.disciplinaIds.includes(d.id)}
                          onChange={() => toggleDisciplinaEdital(d.id)}
                          className="rounded"
                        />
                        {d.nome}
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={criandoEdital || !novoEdital.nome || !novoEdital.orgao}
                  className="bg-cs-secondary text-white py-2.5 px-6 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                  {criandoEdital ? 'Criando...' : 'Criar Edital'}
                </button>
              </form>
            </div>

            {/* Lista de editais */}
            <div className="bg-white rounded-xl border shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-800 mb-4">Editais Cadastrados</h2>
              {editaisLoading ? (
                <div className="text-center py-4">
                  <div className="w-8 h-8 border-3 border-cs-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : editais.length > 0 ? (
                <div className="space-y-4">
                  {editais.map(edital => (
                    <div key={edital.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-bold text-slate-800">{edital.nome}</h3>
                          <p className="text-sm text-slate-500">{edital.orgao} - {edital.ano} - {edital.cargo}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            edital.ativo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {edital.ativo ? 'Ativo' : 'Inativo'}
                          </span>
                          <button
                            onClick={() => handleDeletarEdital(edital.id)}
                            className="text-red-500 hover:text-red-700 text-sm px-2 py-1"
                          >
                            Excluir
                          </button>
                        </div>
                      </div>
                      {edital.disciplinas && edital.disciplinas.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {edital.disciplinas.map((ed, i) => (
                            <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                              {ed.disciplina?.nome}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-4">Nenhum edital cadastrado. Crie um acima!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
