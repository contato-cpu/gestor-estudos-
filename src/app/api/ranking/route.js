import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const periodo = searchParams.get('periodo') || 'geral';
    const limite = parseInt(searchParams.get('limite') || '50');

    // Top rankings
    const topUsers = await prisma.user.findMany({
      orderBy: { pontos: 'desc' },
      take: limite,
      select: {
        id: true,
        nome: true,
        pontos: true,
        sequencia: true,
        plano: true,
        _count: {
          select: { respostas: true },
        },
      },
    });

    // Calcular % de acertos para cada
    const ranking = await Promise.all(
      topUsers.map(async (user, index) => {
        const acertos = await prisma.resposta.count({
          where: { userId: user.id, acertou: true },
        });
        const total = user._count.respostas;
        return {
          posicao: index + 1,
          id: user.id,
          nome: user.nome,
          pontos: user.pontos,
          sequencia: user.sequencia,
          percentualAcertos: total > 0 ? Math.round(acertos / total * 100) : 0,
          totalQuestoes: total,
        };
      })
    );

    // Posição do usuário logado
    let minhaPosicao = null;
    const userId = await getCurrentUserId();
    if (userId) {
      const totalAcima = await prisma.user.count({
        where: {
          pontos: { gt: (await prisma.user.findUnique({ where: { id: userId }, select: { pontos: true } }))?.pontos || 0 },
        },
      });
      const meusDados = await prisma.user.findUnique({
        where: { id: userId },
        select: { nome: true, pontos: true, sequencia: true },
      });
      const minhasRespostas = await prisma.resposta.count({ where: { userId } });
      const meusAcertos = await prisma.resposta.count({ where: { userId, acertou: true } });

      minhaPosicao = {
        posicao: totalAcima + 1,
        nome: meusDados?.nome,
        pontos: meusDados?.pontos || 0,
        sequencia: meusDados?.sequencia || 0,
        percentualAcertos: minhasRespostas > 0 ? Math.round(meusAcertos / minhasRespostas * 100) : 0,
      };
    }

    const totalAlunos = await prisma.user.count();

    return NextResponse.json({ ranking, minhaPosicao, totalAlunos });
  } catch (error) {
    console.error('Erro no ranking:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
