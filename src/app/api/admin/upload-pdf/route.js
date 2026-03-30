import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth';
import { NextResponse } from 'next/server';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Verificar se é admin
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

export async function POST(request) {
  try {
    const adminId = await checkAdmin();
    if (!adminId) {
      return NextResponse.json({ error: 'Acesso restrito' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('pdf');
    const disciplinaId = formData.get('disciplinaId');

    if (!file || !disciplinaId) {
      return NextResponse.json({ error: 'PDF e disciplina são obrigatórios' }, { status: 400 });
    }

    // Verificar disciplina existe
    const disciplina = await prisma.disciplina.findUnique({
      where: { id: disciplinaId },
    });

    if (!disciplina) {
      return NextResponse.json({ error: 'Disciplina não encontrada' }, { status: 404 });
    }

    // Ler o PDF como buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extrair texto com pdf-parse
    let pdfParse;
    try {
      pdfParse = require('pdf-parse');
    } catch (e) {
      return NextResponse.json({ error: 'pdf-parse não disponível no servidor' }, { status: 500 });
    }

    const pdfData = await pdfParse(buffer);
    const textoCompleto = pdfData.text || '';
    const numPaginas = pdfData.numpages || 1;

    if (textoCompleto.length < 300) {
      return NextResponse.json({
        error: 'PDF com pouco texto extraível. Pode ser um PDF escaneado (imagem).',
        chars: textoCompleto.length,
      }, { status: 400 });
    }

    // Criar caderno
    const cadernoId = `caderno-${disciplina.slug}-${Date.now()}`;
    const caderno = await prisma.caderno.create({
      data: {
        id: cadernoId,
        titulo: file.name.replace('.pdf', ''),
        arquivo: file.name,
        totalPaginas: numPaginas,
        disciplinaId: disciplina.id,
      },
    });

    // Dividir texto em blocos
    const inicioConteudo = Math.min(Math.floor(textoCompleto.length * 0.03), 1000);
    const textoUtil = textoCompleto.substring(inicioConteudo);
    const blocos = dividirEmBlocos(textoUtil, 2500, 150);

    let totalQuestoes = 0;
    let erros = 0;
    const resultados = [];

    // Processar cada bloco
    for (let i = 0; i < blocos.length; i++) {
      const numPagina = Math.round(((i + 1) / blocos.length) * numPaginas) || 1;
      const texto = blocos[i];

      // Salvar conteúdo
      try {
        await prisma.conteudoExtraido.create({
          data: { cadernoId: caderno.id, pagina: i + 1, texto },
        });
      } catch (e) { /* duplicado */ }

      // Gerar questões com Gemini
      const questoes = await gerarQuestoes(texto, disciplina.nome, numPagina);

      for (const q of questoes) {
        try {
          if (!q.enunciado || !q.alternativas || q.alternativas.length < 4) continue;

          // Normalizar correta
          for (const alt of q.alternativas) {
            if (typeof alt.correta === 'string') alt.correta = alt.correta.toLowerCase() === 'true';
            if (alt.correct !== undefined && alt.correta === undefined) alt.correta = !!alt.correct;
          }

          const corretas = q.alternativas.filter(a => a.correta === true);
          if (corretas.length === 0) q.alternativas[0].correta = true;
          else if (corretas.length > 1) {
            let found = false;
            for (const alt of q.alternativas) {
              if (alt.correta && !found) found = true;
              else alt.correta = false;
            }
          }

          let topicoId = null;
          if (q.topico && q.topico.length > 2) {
            const slug = q.topico.toLowerCase()
              .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
              .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
              .substring(0, 80);
            try {
              const topico = await prisma.topico.upsert({
                where: { slug_disciplinaId: { slug, disciplinaId: disciplina.id } },
                create: { nome: q.topico.substring(0, 100), slug, disciplinaId: disciplina.id },
                update: {},
              });
              topicoId = topico.id;
            } catch (e) { /* ignorar */ }
          }

          await prisma.questao.create({
            data: {
              enunciado: q.enunciado,
              alternativas: q.alternativas,
              explicacao: q.explicacao || 'Veja o caderno para explicação detalhada.',
              dificuldade: ['FACIL', 'MEDIO', 'DIFICIL'].includes(q.dificuldade) ? q.dificuldade : 'MEDIO',
              disciplinaId: disciplina.id,
              topicoId,
              cadernoId: caderno.id,
              paginaRef: numPagina,
              fonte: 'IA_GERADA',
            },
          });
          totalQuestoes++;
        } catch (e) { /* ignorar */ }
      }

      resultados.push({ bloco: i + 1, questoes: questoes.length });

      // Rate limiting para Gemini
      if (i < blocos.length - 1) {
        await new Promise(r => setTimeout(r, 4500));
      }
    }

    // Marcar caderno como processado
    await prisma.caderno.update({
      where: { id: caderno.id },
      data: { processado: true },
    });

    return NextResponse.json({
      success: true,
      caderno: {
        id: caderno.id,
        titulo: caderno.titulo,
        paginas: numPaginas,
        chars: textoCompleto.length,
      },
      blocos: blocos.length,
      totalQuestoes,
      resultados,
    });

  } catch (error) {
    console.error('Erro no upload PDF:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function dividirEmBlocos(texto, tamanho, minimo) {
  const blocos = [];
  let pos = 0;
  while (pos < texto.length) {
    let fim = Math.min(pos + tamanho, texto.length);
    if (fim < texto.length) {
      const proximaQuebra = texto.indexOf('\n\n', fim - 300);
      if (proximaQuebra > 0 && proximaQuebra < fim + 500) fim = proximaQuebra;
      else {
        const ultimoPonto = texto.lastIndexOf('. ', fim);
        if (ultimoPonto > pos + minimo) fim = ultimoPonto + 1;
      }
    }
    const bloco = texto.substring(pos, fim).trim();
    if (bloco.length >= minimo) blocos.push(bloco);
    pos = fim;
  }
  return blocos;
}

async function gerarQuestoes(texto, disciplina, pagina) {
  if (!GEMINI_API_KEY) return [];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Você é professor de ${disciplina} para concursos de Magistratura. Gere 5 questões objetivas de alta qualidade.

REGRAS:
- 4 alternativas (A,B,C,D), EXATAMENTE 1 correta
- Inclua FACIL, MEDIO e DIFICIL
- Explicação com fundamento legal
- Tópico específico

CONTEÚDO (p.${pagina}):
${texto.substring(0, 3000)}

Responda APENAS JSON:
[{"enunciado":"...","topico":"...","dificuldade":"MEDIO","alternativas":[{"letra":"A","texto":"...","correta":false},{"letra":"B","texto":"...","correta":true},{"letra":"C","texto":"...","correta":false},{"letra":"D","texto":"...","correta":false}],"explicacao":"..."}]`
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 6000,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return Array.isArray(parsed) ? parsed : (parsed.questoes || []);
  } catch (err) {
    console.error('Erro Gemini:', err.message);
    return [];
  }
}
