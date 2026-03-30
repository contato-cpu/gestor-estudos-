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

    // Check if user is the admin (Cintia) by email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    if (!user || user.email !== 'contato@cadernossistematizado.com') {
      return NextResponse.json(
        { error: 'Acesso restrito ao administrador' },
        { status: 403 }
      );
    }

    // Get total users count
    const totalUsers = await prisma.user.count();

    // Get total questions count
    const totalQuestoes = await prisma.questao.count();

    // Get total answers count
    const totalRespostas = await prisma.resposta.count();

    // Get ALL 29 disciplines with their question counts
    const allDisciplinas = await prisma.disciplina.findMany({
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        ordem: 'asc',
      },
    });

    const questoesPerDisciplinaData = await Promise.all(
      allDisciplinas.map(async (disc) => {
        const count = await prisma.questao.count({
          where: { disciplinaId: disc.id },
        });
        return {
          id: disc.id,
          disciplina: disc.nome,
          count,
        };
      })
    );

    const questoesPerDisciplinaFormatted = questoesPerDisciplinaData.sort((a, b) => b.count - a.count);

    // Get recent registrations (last 10 users)
    const recentUsers = await prisma.user.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        nome: true,
        email: true,
        plano: true,
        createdAt: true,
      },
    });

    // Get recent activity feed (last 20 answers from all users)
    const recentAnswers = await prisma.resposta.findMany({
      take: 20,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        acertou: true,
        createdAt: true,
        user: {
          select: {
            nome: true,
          },
        },
        questao: {
          select: {
            disciplina: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
    });

    const recentActivityFormatted = recentAnswers.map(answer => ({
      id: answer.id,
      userName: answer.user.nome,
      discipline: answer.questao.disciplina.nome,
      acertou: answer.acertou,
      createdAt: answer.createdAt,
    }));

    // Calculate quick stats
    let totalAccuracy = 0;
    if (totalRespostas > 0) {
      const acertosCount = await prisma.resposta.count({
        where: { acertou: true },
      });
      totalAccuracy = Math.round((acertosCount / totalRespostas) * 100);
    }

    // Most popular discipline (most answered)
    const disciplinaPopularidade = await prisma.resposta.groupBy({
      by: ['questao'],
      _count: {
        id: true,
      },
    });

    let mostPopularDiscipline = 'N/A';
    if (questoesPerDisciplinaFormatted.length > 0) {
      mostPopularDiscipline = questoesPerDisciplinaFormatted[0].disciplina;
    }

    // Most difficult discipline (lowest accuracy)
    let mostDifficultDiscipline = 'N/A';
    let lowestAccuracy = 100;

    for (const disc of questoesPerDisciplinaFormatted) {
      const totalAnswers = await prisma.resposta.count({
        where: {
          questao: {
            disciplinaId: disc.id,
          },
        },
      });

      if (totalAnswers > 0) {
        const correctAnswers = await prisma.resposta.count({
          where: {
            questao: {
              disciplinaId: disc.id,
            },
            acertou: true,
          },
        });
        const accuracy = Math.round((correctAnswers / totalAnswers) * 100);
        if (accuracy < lowestAccuracy) {
          lowestAccuracy = accuracy;
          mostDifficultDiscipline = disc.disciplina;
        }
      }
    }

    return NextResponse.json({
      summary: {
        totalUsers,
        totalQuestoes,
        totalRespostas,
      },
      questoesPerDisciplina: questoesPerDisciplinaFormatted,
      recentUsers,
      recentActivity: recentActivityFormatted,
      quickStats: {
        averageAccuracy: totalAccuracy,
        mostPopularDiscipline,
        mostDifficultDiscipline: mostDifficultDiscipline === 'N/A' ? 'N/A' : `${mostDifficultDiscipline} (${lowestAccuracy}%)`,
      },
    });
  } catch (error) {
    console.error('Error fetching admin data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
