import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

// GET /api/questoes — Buscar questões com filtros
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const disciplina = searchParams.get('disciplina');
    const dificuldade = searchParams.get('dificuldade');
    const topico = searchParams.get('topico');
    const limite = parseInt(searchParams.get('limite') || '10');
    const modo = searchParams.get('modo'); // normal, revisao, simulado

    const where = { ativa: true };

    if (disciplina) {
      where.disciplina = { slug: disciplina };
    }

    if (dificuldade) {
      where.dificuldade = dificuldade.toUpperCase();
    }

    if (topico) {
      where.topico = { slug: topico };
    }

    // Modo revisão: questões que o aluno errou
    if (modo === 'revisao') {
      const userId = await getCurrentUserId();
      if (userId) {
        const erradas = await prisma.resposta.findMany({
          where: { userId, acertou: false },
          select: { questaoId: true },
          distinct: ['questaoId'],
          take: limite,
        });
        where.id = { in: erradas.map(r => r.questaoId) };
      }
    }

    const questoes = await prisma.questao.findMany({
      where,
      take: limite,
      orderBy: modo === 'simulado' ? { id: 'asc' } : undefined,
      include: {
        disciplina: { select: { nome: true, slug: true, icone: true } },
        topico: { select: { nome: true } },
      },
    });

    // Embaralhar se não for simulado
    const resultado = modo === 'simulado'
      ? questoes
      : questoes.sort(() => Math.random() - 0.5);

    return NextResponse.json({ questoes: resultado });
  } catch (error) {
    console.error('Erro ao buscar questões:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// POST /api/questoes/responder — Registrar resposta
export async function POST(request) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const { questaoId, letraEscolhida, tempoMs } = await request.json();

    // Buscar questão para verificar resposta
    const questao = await prisma.questao.findUnique({
      where: { id: questaoId },
    });

    if (!questao) {
      return NextResponse.json({ error: 'Questão não encontrada' }, { status: 404 });
    }

    const alternativas = questao.alternativas;
    const correta = alternativas.find(a => a.correta);
    const acertou = correta?.letra === letraEscolhida;

    // Registrar resposta
    const resposta = await prisma.resposta.create({
      data: { userId, questaoId, letraEscolhida, acertou, tempoMs },
    });

    // Atualizar contadores da questão
    await prisma.questao.update({
      where: { id: questaoId },
      data: {
        vezesRespondida: { increment: 1 },
        vezesAcertada: acertou ? { increment: 1 } : undefined,
      },
    });

    // Atualizar pontuação do usuário
    const pontos = acertou ? (questao.dificuldade === 'DIFICIL' ? 15 : questao.dificuldade === 'MEDIO' ? 10 : 5) : 1;
    await prisma.user.update({
      where: { id: userId },
      data: { pontos: { increment: pontos } },
    });

    return NextResponse.json({
      acertou,
      letraCorreta: correta?.letra,
      explicacao: questao.explicacao,
      pontos,
    });
  } catch (error) {
    console.error('Erro ao registrar resposta:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
