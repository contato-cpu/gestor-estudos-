import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nome: true,
        email: true,
        plano: true,
        pontos: true,
        sequencia: true,
      },
    });

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Erro ao buscar usuario:', error);
    return NextResponse.json({ user: null }, { status: 500 });
  }
}
