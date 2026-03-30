import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

// GET /api/dashboard — Obter dados do dashboard do usuário
export async function GET(request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    // 1. Obter dados do usuário (sequencia, pontos)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { sequencia: true, pontos: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    // 2. Total de questões no banco
    const totalQuestoes = await prisma.questao.count({
      where: { ativa: true },
    });

    // 3. Total de alunos (para ranking)
    const totalAlunos = await prisma.user.count();

    // 4. Respostas do usuário hoje (últimas 24h)
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const respostasHoje = await prisma.resposta.findMany({
      where: {
        userId,
        createdAt: { gte: hoje },
      },
      select: { acertou: true },
    });

    const questoesHoje = respostasHoje.length;
    const acertosHoje = respostasHoje.filter(r => r.acertou).length;

    // 5. Posição no ranking (contar quantos usuários têm mais pontos)
    const usuariosComMaisPontos = await prisma.user.count({
      where: {
        pontos: { gt: user.pontos },
      },
    });
    const posicaoRanking = usuariosComMaisPontos + 1;

    // 6. Progresso por disciplina
    const progresso = await prisma.progresso.findMany({
      where: { userId },
      select: {
        id: true,
        disciplinaSlug: true,
        totalRespondidas: true,
        totalAcertos: true,
      },
    });

    // Buscar dados das disciplinas
    const disciplinas = await prisma.disciplina.findMany({
      where: { ativa: true },
      select: { id: true, nome: true, slug: true, icone: true, cor: true, ordem: true },
      orderBy: { ordem: 'asc' },
    });

    // Combinar progresso com dados das disciplinas
    const progressoComDados = disciplinas.map(d => {
      const prog = progresso.find(p => p.disciplinaSlug === d.slug);
      return {
        id: d.id,
        nome: d.nome,
        slug: d.slug,
        icone: d.icone,
        cor: d.cor,
        totalRespondidas: prog?.totalRespondidas || 0,
        totalAcertos: prog?.totalAcertos || 0,
      };
    });

    const stats = {
      questoesHoje,
      acertosHoje,
      sequencia: user.sequencia,
      posicaoRanking,
      totalAlunos,
      totalQuestoes,
    };

    return NextResponse.json({
      stats,
      progresso: progressoComDados,
    });
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
