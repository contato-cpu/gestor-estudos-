import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { email, senha } = await request.json();

    if (!email || !senha) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
    }

    const senhaValida = await verifyPassword(senha, user.senha);
    if (!senhaValida) {
      return NextResponse.json({ error: 'Email ou senha incorretos' }, { status: 401 });
    }

    const token = generateToken(user.id);
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, nome: user.nome, email: user.email, plano: user.plano },
    });
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
