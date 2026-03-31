'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '\uD83C\uDFE0', label: 'Dashboard' },
  { href: '/questoes', icon: '\u2753', label: 'Questoes' },
  { href: '/ranking', icon: '\uD83C\uDFC6', label: 'Ranking' },
  { href: '/editais', icon: '\uD83D\uDCCB', label: 'Editais' },
  { href: '/desempenho', icon: '\uD83D\uDCCA', label: 'Desempenho' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        if (data.user && data.user.email === 'contato@cadernossistematizado.com') {
          setIsAdmin(true);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar usuario:', err);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      window.location.href = '/login';
    }
  };

  const userName = user ? user.nome : 'Carregando...';
  const userPlan = user ? user.plano : '';
  const userInitial = userName.charAt(0).toUpperCase();
  const planLabels = { FREE: 'Plano Free', PRO: 'Plano Pro', PREMIUM: 'Plano Premium' };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-cs-dark text-white flex flex-col z-50">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold">{'\uD83D\uDCDA'} Cadernos</h1>
        <p className="text-xs text-slate-400 mt-1">Sistematizados</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || (pathname && pathname.startsWith(item.href + '/'));
          return (
            <Link key={item.href} href={item.href}
              className={'flex items-center gap-3 px-4 py-3 rounded-lg transition-all ' + (active ? 'bg-cs-secondary text-white font-semibold' : 'text-slate-300 hover:bg-white/5 hover:text-white')}>
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      {isAdmin && (
        <div className="p-4 border-t border-white/10">
          <Link href="/admin"
            className={'flex items-center gap-3 px-4 py-3 rounded-lg transition-all ' + ((pathname === '/admin' || (pathname && pathname.startsWith('/admin/'))) ? 'bg-cs-secondary text-white font-semibold' : 'text-slate-300 hover:bg-white/5 hover:text-white')}>
            <span className="text-xl">{'\u2699\uFE0F'}</span>
            <span>Admin</span>
          </Link>
        </div>
      )}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cs-secondary flex items-center justify-center font-bold">{userInitial}</div>
          <div>
            <p className="text-sm font-medium">{userName}</p>
            <p className="text-xs text-slate-400">{planLabels[userPlan] || userPlan}</p>
          </div>
        </div>
        <button onClick={handleLogout} disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-50">
          <span className="text-lg">{'\uD83D\uDEAA'}</span>
          <span className="text-sm">{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </aside>
  );
}
