'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const NAV_ITEMS = [
  { href: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { href: '/questoes', icon: '❓', label: 'Questões' },
  { href: '/ranking', icon: '🏆', label: 'Ranking' },
  { href: '/editais', icon: '📋', label: 'Editais' },
  { href: '/desempenho', icon: '📊', label: 'Desempenho' },
];

const ADMIN_ITEMS = [
  { href: '/admin', icon: '⚙️', label: 'Admin' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (response.ok) {
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-cs-dark text-white flex flex-col z-50">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold">📚 Cadernos</h1>
        <p className="text-xs text-slate-400 mt-1">Sistematizados</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                active
                  ? 'bg-cs-secondary text-white font-semibold'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Section */}
      <div className="p-4 border-t border-white/10">
        <nav className="space-y-1">
          {ADMIN_ITEMS.map((item) => {
            const active = pathname === item.href || pathname?.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  active
                    ? 'bg-cs-secondary text-white font-semibold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cs-secondary flex items-center justify-center font-bold">
            A
          </div>
          <div>
            <p className="text-sm font-medium">Aluno CS</p>
            <p className="text-xs text-slate-400">Plano Pro</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-slate-300 hover:bg-white/5 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="text-lg">🚪</span>
          <span className="text-sm">{isLoggingOut ? 'Saindo...' : 'Sair'}</span>
        </button>
      </div>
    </aside>
  );
}
