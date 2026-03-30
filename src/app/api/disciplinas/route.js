import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/disciplinas — Buscar todas as disciplinas ativas
export async function GET(request) {
  try {
    const disciplinas = await prisma.disciplina.findMany({
      where: { ativa: true },
      select: {
        id: true,
        nome: true,
        slug: true,
        icone: true,
        cor: true,
        ordem: true,
      },
      orderBy: { ordem: 'asc' },
    });

    return NextResponse.json({ disciplinas });
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
