'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [modo, setModo] = useState('login'); // login | cadastro
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const endpoint = modo === 'login' ? '/api/auth/login' : '/api/auth/register';
      const body = modo === 'login'
        ? { email, senha }
        : { nome, email, senha };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setErro(data.error || 'Erro ao processar');
        return;
      }

      router.push('/dashboard');
    } catch (err) {
      setErro('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cs-dark via-cs-primary to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white">📚 Cadernos</h1>
          <p className="text-blue-300 text-lg">Sistematizados</p>
          <p className="text-blue-200/60 text-sm mt-2">Gestor Inteligente de Estudos</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => { setModo('login'); setErro(''); }}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition ${
                modo === 'login' ? 'bg-white text-cs-primary shadow-sm' : 'text-slate-500'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => { setModo('cadastro'); setErro(''); }}
              className={`flex-1 py-2.5 rounded-md text-sm font-semibold transition ${
                modo === 'cadastro' ? 'bg-white text-cs-primary shadow-sm' : 'text-slate-500'
              }`}
            >
              Criar Conta
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {modo === 'cadastro' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nome completo</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:ring-2 focus:ring-cs-secondary focus:border-transparent outline-none"
                  placeholder="Seu nome"
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:ring-2 focus:ring-cs-secondary focus:border-transparent outline-none"
                placeholder="seu@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-3 text-slate-800 focus:ring-2 focus:ring-cs-secondary focus:border-transparent outline-none"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {erro && (
              <div className="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cs-secondary text-white rounded-lg py-3 font-semibold hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? 'Carregando...' : modo === 'login' ? 'Entrar' : 'Criar Conta'}
            </button>
          </form>

          <p className="text-center text-xs text-slate-400 mt-6">
            Plataforma exclusiva para alunos Cadernos Sistematizados
          </p>
        </div>
      </div>
    </div>
  );
}
