import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user basic stats
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        pontos: true,
        sequencia: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get all responses for this user
    const respostas = await prisma.resposta.findMany({
      where: { userId },
      select: {
        acertou: true,
        createdAt: true,
        questao: {
          select: {
            disciplinaId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Get all disciplines with their names
    const disciplinas = await prisma.disciplina.findMany({
      select: {
        id: true,
        nome: true,
        slug: true,
        cor: true,
      },
    });

    const disciplinaMap = Object.fromEntries(
      disciplinas.map(d => [d.id, d])
    );

    // Calculate total stats
    const totalRespondidas = respostas.length;
    const totalAcertos = respostas.filter(r => r.acertou).length;

    // Calculate weekly evolution (last 8 weeks)
    const now = new Date();
    const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

    const weeklyData = [];
    for (let i = 7; i >= 0; i--) {
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

      const weekResponses = respostas.filter(r => {
        const responseDate = new Date(r.createdAt);
        return responseDate >= weekStart && responseDate <= weekEnd;
      });

      const weekNumber = Math.floor((now.getTime() - weekEnd.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

      weeklyData.push({
        semana: `Sem ${8 - i}`,
        questoes: weekResponses.length,
        acertos: weekResponses.filter(r => r.acertou).length,
      });
    }

    // Get per-discipline performance
    const progressoData = await prisma.progresso.findMany({
      where: { userId },
    });

    const disciplinaPerformance = progressoData.map(prog => {
      const disciplina = disciplinas.find(d => d.slug === prog.disciplinaSlug);
      const perc = prog.totalRespondidas > 0
        ? Math.round((prog.totalAcertos / prog.totalRespondidas) * 100)
        : 0;

      return {
        nome: disciplina?.nome || prog.disciplinaSlug,
        slug: prog.disciplinaSlug,
        cor: disciplina?.cor || '#3B82F6',
        total: prog.totalRespondidas,
        acertos: prog.totalAcertos,
        perc,
      };
    }).sort((a, b) => b.total - a.total);

    return NextResponse.json({
      stats: {
        totalRespondidas,
        totalAcertos,
        sequencia: user.sequencia,
        pontos: user.pontos,
        mediaGeral: totalRespondidas > 0
          ? Math.round((totalAcertos / totalRespondidas) * 100)
          : 0,
      },
      evolucaoSemanal: weeklyData,
      desempenhoDisc: disciplinaPerformance,
    });
  } catch (error) {
    console.error('Error fetching desempenho:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
