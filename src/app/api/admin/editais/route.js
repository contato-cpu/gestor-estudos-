import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { NextResponse } from 'next/server';

async function checkAdmin() {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!user || user.email !== 'contato@cadernossistematizado.com') return null;
  return userId;
}

// Listar editais com disciplinas
export async function GET(request) {
  try {
    const adminId = await checkAdmin();
    if (!adminId) return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });

    const editais = await prisma.edital.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        disciplinas: {
          include: {
            disciplina: { select: { id: true, nome: true, slug: true } },
            topicos: true,
          },
        },
      },
    });

    const allDisciplinas = await prisma.disciplina.findMany({
      orderBy: { ordem: 'asc' },
      select: { id: true, nome: true, slug: true },
    });

    return NextResponse.json({ editais, disciplinas: allDisciplinas });
  } catch (error) {
    console.error('Erro editais:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Criar novo edital
export async function POST(request) {
  try {
    const adminId = await checkAdmin();
    if (!adminId) return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });

    const body = await request.json();
    const { nome, orgao, ano, cargo, disciplinaIds } = body;

    if (!nome || !orgao || !ano) {
      return NextResponse.json({ error: 'Nome, órgão e ano são obrigatórios' }, { status: 400 });
    }

    const edital = await prisma.edital.create({
      data: {
        nome,
        orgao,
        ano: parseInt(ano),
        cargo: cargo || 'Juiz Substituto',
        disciplinas: {
          create: (disciplinaIds || []).map(id => ({
            disciplinaId: id,
            peso: 1.0,
            questoesPrevistas: 0,
          })),
        },
      },
      include: {
        disciplinas: {
          include: {
            disciplina: { select: { id: true, nome: true } },
          },
        },
      },
    });

    return NextResponse.json({ success: true, edital });
  } catch (error) {
    console.error('Erro criar edital:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Atualizar edital
export async function PUT(request) {
  try {
    const adminId = await checkAdmin();
    if (!adminId) return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });

    const body = await request.json();
    const { id, nome, orgao, ano, cargo, ativo, disciplinaIds } = body;

    if (!id) return NextResponse.json({ error: 'ID do edital é obrigatório' }, { status: 400 });

    // Atualizar edital
    const edital = await prisma.edital.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(orgao && { orgao }),
        ...(ano && { ano: parseInt(ano) }),
        ...(cargo && { cargo }),
        ...(ativo !== undefined && { ativo }),
      },
    });

    // Se disciplinas foram enviadas, atualizar
    if (disciplinaIds) {
      // Remover antigas
      await prisma.editalDisciplina.deleteMany({ where: { editalId: id } });
      // Criar novas
      for (const discId of disciplinaIds) {
        await prisma.editalDisciplina.create({
          data: { editalId: id, disciplinaId: discId, peso: 1.0, questoesPrevistas: 0 },
        });
      }
    }

    return NextResponse.json({ success: true, edital });
  } catch (error) {
    console.error('Erro atualizar edital:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Deletar edital
export async function DELETE(request) {
  try {
    const adminId = await checkAdmin();
    if (!adminId) return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID é obrigatório' }, { status: 400 });

    // Deletar tópicos do edital, depois disciplinas, depois edital
    const editalDiscs = await prisma.editalDisciplina.findMany({ where: { editalId: id } });
    for (const disc of editalDiscs) {
      await prisma.editalTopico.deleteMany({ where: { editalDisciplinaId: disc.id } });
    }
    await prisma.editalDisciplina.deleteMany({ where: { editalId: id } });
    await prisma.edital.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro deletar edital:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
