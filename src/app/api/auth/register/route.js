import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { nome, email, senha } = await request.json();

    if (!nome || !email || !senha) {
      return NextResponse.json({ error: 'Preencha todos os campos' }, { status: 400 });
    }

    if (senha.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter pelo menos 6 caracteres' }, { status: 400 });
    }

    // Verificar se email já existe
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
    }

    // Criar usuário
    const senhaHash = await hashPassword(senha);
    const user = await prisma.user.create({
      data: { nome, email, senha: senhaHash },
    });

    // Gerar token e setar cookie
    const token = generateToken(user.id);
    const cookieStore = await cookies();
    cookieStore.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 dias
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: { id: user.id, nome: user.nome, email: user.email },
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
