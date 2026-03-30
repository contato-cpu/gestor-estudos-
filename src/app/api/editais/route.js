import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';

export async function GET(request) {
  try {
    const userId = await getCurrentUserId();

    // Fetch all active editais with their disciplines
    const editais = await prisma.edital.findMany({
      where: { ativo: true },
      include: {
        disciplinas: {
          include: {
            disciplina: {
              select: {
                id: true,
                nome: true,
                slug: true,
                icone: true,
                cor: true,
              },
            },
          },
        },
      },
      orderBy: { ano: 'desc' },
    });

    // Enrich with user progress if logged in
    const editaisComProgresso = await Promise.all(
      editais.map(async (edital) => {
        const disciplinas = edital.disciplinas.map((ed) => {
          const disco = ed.disciplina;
          return {
            id: disco.id,
            nome: disco.nome,
            slug: disco.slug,
            icone: disco.icone,
            cor: disco.cor,
            peso: ed.peso,
            questoesPrevistas: ed.questoesPrevistas,
          };
        });

        let progressoGeral = 0;

        if (userId) {
          // Fetch user progress for all disciplines in this edital
          const progressoUser = await prisma.progresso.findMany({
            where: {
              userId,
              disciplinaSlug: {
                in: disciplinas.map((d) => d.slug),
              },
            },
            select: {
              disciplinaSlug: true,
              totalRespondidas: true,
              totalAcertos: true,
            },
          });

          const progressMap = {};
          progressoUser.forEach((p) => {
            progressMap[p.disciplinaSlug] = {
              totalRespondidas: p.totalRespondidas || 0,
              totalAcertos: p.totalAcertos || 0,
            };
          });

          // Enrich disciplines with user progress and calculate overall progress
          const disciplinasComProgresso = disciplinas.map((disc) => {
            const prog = progressMap[disc.slug];
            const seuProgresso = prog && prog.totalRespondidas > 0
              ? Math.round((prog.totalAcertos / prog.totalRespondidas) * 100)
              : 0;
            return { ...disc, seuProgresso };
          });

          // Calculate overall progress weighted by peso
          const totalPeso = disciplinasComProgresso.reduce((sum, d) => sum + d.peso, 0);
          if (totalPeso > 0) {
            progressoGeral = Math.round(
              disciplinasComProgresso.reduce((sum, d) => sum + (d.seuProgresso * d.peso), 0) / totalPeso
            );
          }

          return {
            id: edital.id,
            nome: edital.nome,
            orgao: edital.orgao,
            ano: edital.ano,
            cargo: edital.cargo,
            disciplinas: disciplinasComProgresso,
            progressoGeral,
          };
        } else {
          // No user logged in - return 0 progress
          return {
            id: edital.id,
            nome: edital.nome,
            orgao: edital.orgao,
            ano: edital.ano,
            cargo: edital.cargo,
            disciplinas: disciplinas.map((d) => ({ ...d, seuProgresso: 0 })),
            progressoGeral: 0,
          };
        }
      })
    );

    return NextResponse.json(editaisComProgresso);
  } catch (error) {
    console.error('Error fetching editais:', error);
    return NextResponse.json(
      { error: 'Failed to fetch editais' },
      { status: 500 }
    );
  }
}
