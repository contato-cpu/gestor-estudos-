import './globals.css';

export const metadata = {
  title: 'Gestor de Estudos | Cadernos Sistematizados',
  description: 'Plataforma inteligente de estudos para concursos da Magistratura',
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-slate-50">
        {children}
      </body>
    </html>
  );
}
