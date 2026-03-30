import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/process-pdf — Processar conteúdo extraído e gerar questões
export async function POST(request) {
  try {
    const { cadernoId, textosPaginas } = await request.json();

    if (!cadernoId || !textosPaginas?.length) {
      return NextResponse.json({ error: 'Dados incompletos' }, { status: 400 });
    }

    const caderno = await prisma.caderno.findUnique({
      where: { id: cadernoId },
      include: { disciplina: true },
    });

    if (!caderno) {
      return NextResponse.json({ error: 'Caderno não encontrado' }, { status: 404 });
    }

    let totalGeradas = 0;
    const erros = [];

    for (const { pagina, texto } of textosPaginas) {
      try {
        await prisma.conteudoExtraido.upsert({
          where: { cadernoId_pagina: { cadernoId, pagina } },
          create: { cadernoId, pagina, texto, processado: false },
          update: { texto },
        });

        const questoes = await gerarQuestoesIA(texto, caderno.disciplina.nome, pagina);

        for (const q of questoes) {
          let topicoId = null;
          if (q.topico) {
            const slug = q.topico.toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

            const topico = await prisma.topico.upsert({
              where: { slug_disciplinaId: { slug, disciplinaId: caderno.disciplinaId } },
              create: { nome: q.topico, slug, disciplinaId: caderno.disciplinaId },
              update: {},
            });
            topicoId = topico.id;
          }

          await prisma.questao.create({
            data: {
              enunciado: q.enunciado,
              alternativas: q.alternativas,
              explicacao: q.explicacao,
              dificuldade: q.dificuldade || 'MEDIO',
              disciplinaId: caderno.disciplinaId,
              topicoId,
              cadernoId,
              paginaRef: pagina,
              fonte: 'IA_GERADA',
            },
          });
          totalGeradas++;
        }

        await prisma.conteudoExtraido.update({
          where: { cadernoId_pagina: { cadernoId, pagina } },
          data: { processado: true },
        });

      } catch (err) {
        erros.push({ pagina, erro: err.message });
      }
    }

    if (erros.length === 0) {
      await prisma.caderno.update({
        where: { id: cadernoId },
        data: { processado: true },
      });
    }

    return NextResponse.json({
      success: true,
      totalGeradas,
      erros: erros.length > 0 ? erros : undefined,
    });
  } catch (error) {
    console.error('Erro ao processar PDF:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// ─── Função de geração de questões com Google Gemini ────
async function gerarQuestoesIA(texto, disciplina, pagina) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada');

  const prompt = `Você é um professor especialista em ${disciplina} para concursos de Magistratura e Ministério Público no Brasil.

Com base no texto abaixo (extraído da página ${pagina} de um caderno de estudos), gere questões objetivas no estilo de bancas como VUNESP, FCC, CESPE e FGV.

TEXTO:
${texto}

REGRAS:
1. Gere entre 2 a 5 questões por página (depende da densidade do conteúdo)
2. Cada questão deve ter 4 alternativas (A, B, C, D), sendo apenas 1 correta
3. As alternativas incorretas devem ser plausíveis (não absurdas)
4. A explicação deve citar a página de referência do caderno
5. Classifique a dificuldade: FACIL, MEDIO ou DIFICIL
6. Identifique o tópico principal de cada questão

Responda SOMENTE em JSON válido, com este formato:
[
  {
    "enunciado": "texto da pergunta",
    "topico": "nome do tópico",
    "dificuldade": "MEDIO",
    "alternativas": [
      {"letra": "A", "texto": "...", "correta": false},
      {"letra": "B", "texto": "...", "correta": true},
      {"letra": "C", "texto": "...", "correta": false},
      {"letra": "D", "texto": "...", "correta": false}
    ],
    "explicacao": "explicação detalhada citando a página ${pagina} do caderno"
  }
]`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 4000,
          responseMimeType: 'application/json',
        },
      }),
    }
  );

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) return [];

  try {
    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : (parsed.questoes || []);
  } catch {
    console.error('Erro ao parsear JSON da IA:', content?.substring(0, 200));
    return [];
  }
}
