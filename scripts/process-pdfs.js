#!/usr/bin/env node
// ============================================
// PIPELINE DE PROCESSAMENTO DE PDFs - OLLAMA LOCAL
// Cadernos Sistematizados → Questões por IA
// Usando Llama3 via Ollama (SEM LIMITES)
// ============================================
// Uso: node scripts/process-pdfs.js [caminho-da-pasta-pdfs]

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const { PrismaClient } = require('@prisma/client');

require('dotenv').config();

const prisma = new PrismaClient();

// Mapeamento de pastas → disciplinas (case insensitive)
const PASTA_DISCIPLINA = {
  'DIREITO CONSTITUCIONAL': 'constitucional',
  'DIREITO PENAL GERAL': 'penal-geral',
  'DIREITO PENAL ESPECIAL': 'penal-especial',
  'DIREITO CIVIL': 'civil',
  'PROCESSO CIVIL': 'processo-civil',
  'PROCESSO PENAL': 'processo-penal',
  'DIREITO PROCESSUAL PENAL': 'processo-penal',
  'DIREITO ADMINISTRATIVO': 'administrativo',
  'DIREITO TRIBUTÁRIO': 'tributario',
  'DIREITO TRIBUTARIO': 'tributario',
  'DIREITO DO TRABALHO': 'trabalho',
  'PROCESSO DO TRABALHO': 'processo-trabalho',
  'DIREITO EMPRESARIAL': 'empresarial',
  'DIREITO AMBIENTAL': 'ambiental',
  'HUMANOS': 'humanos',
  'DIREITOS HUMANOS': 'humanos',
  'CRIMINOLOGIA': 'criminologia',
  'DIREITO AGRÁRIO': 'agrario',
  'DIREITO AGRARIO': 'agrario',
  'DIREITO ELEITORAL': 'eleitoral',
  'DIREITO ECONÔMICO': 'economico',
  'DIREITO ECONOMICO': 'economico',
  'DIREITO URBANÍSTICO': 'urbanistico',
  'DIREITO URBANISTICO': 'urbanistico',
  'DIREITO DA CRIANÇA E DO ADOLESCENTE': 'eca',
  'DIREITO DA CRIANCA E DO ADOLESCENTE': 'eca',
  'ECA': 'eca',
  'DIREITO DO CONSUMIDOR': 'consumidor',
  'DIREITO FINANCEIRO': 'financeiro',
  'DIREITO INTERNACIONAL PÚBLICO': 'internacional',
  'DIREITO INTERNACIONAL PUBLICO': 'internacional',
  'DIREITOS DAS EXECUÇÕES PENAIS': 'execucoes-penais',
  'DIREITOS DAS EXECUCOES PENAIS': 'execucoes-penais',
  'EXECUÇÕES PENAIS': 'execucoes-penais',
  'EXECUCOES PENAIS': 'execucoes-penais',
  'DIREITOS DIFUSOS E COLETIVOS': 'difusos-coletivos',
  'FAZENDA PÚBLICA EM JUÍZO': 'fazenda-publica',
  'FAZENDA PUBLICA EM JUIZO': 'fazenda-publica',
  'PENAL E PROCESSO PENAL MILITAR': 'penal-militar',
  'HUMANÍSTICA': 'humanistica',
  'HUMANISTICA': 'humanistica',
  'PREVIDENCIÁRIO': 'previdenciario',
  'PREVIDENCIARIO': 'previdenciario',
  'PRINCÍPIO E ATRIBUIÇÕES DO MP': 'mp-atribuicoes',
  'PRINCIPIO E ATRIBUICOES DO MP': 'mp-atribuicoes',
  'MP': 'mp-atribuicoes',
};

// Config para maximizar questões com Ollama local
const CONFIG = {
  MODELO: 'llama3',
  OLLAMA_URL: 'http://localhost:11434',
  TAMANHO_BLOCO: 3000,        // Blocos maiores = menos chamadas = mais rápido
  MIN_CHARS_BLOCO: 150,
  MIN_CHARS_PDF: 300,
  PULAR_INICIO_PCT: 0.03,
  MAX_RETRIES: 3,
  DELAY_ENTRE_CHAMADAS: 500,  // Apenas 0.5s - SEM RATE LIMIT local!
  QUESTOES_POR_BLOCO: 5,
};

// Estatísticas globais
let stats = {
  pdfsProcessados: 0,
  pdfsErro: 0,
  pdfsIgnorados: 0,
  blocosProcessados: 0,
  blocosErro: 0,
  totalQuestoes: 0,
  questoesPorDisciplina: {},
  inicio: Date.now(),
};

async function main() {
  const pastaBase = process.argv[2] || '.';

  // Verificar se Ollama está rodando
  try {
    const check = await fetch(`${CONFIG.OLLAMA_URL}/api/tags`);
    const models = await check.json();
    const temModelo = models.models?.some(m => m.name.startsWith(CONFIG.MODELO));
    if (!temModelo) {
      console.error(`❌ Modelo "${CONFIG.MODELO}" não encontrado no Ollama.`);
      console.error(`   Rode: ollama pull ${CONFIG.MODELO}`);
      process.exit(1);
    }
    console.log(`✅ Ollama conectado | Modelo: ${CONFIG.MODELO}\n`);
  } catch (err) {
    console.error('❌ Ollama não está rodando! Abra o Ollama primeiro.');
    console.error('   Erro:', err.message);
    process.exit(1);
  }

  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  📚 PIPELINE MÁXIMO DE QUESTÕES               ║');
  console.log('║  Cadernos Sistematizados → Questões IA         ║');
  console.log(`║  🤖 ${CONFIG.MODELO} via Ollama LOCAL | SEM LIMITES    ║`);
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`\n📂 Pasta: ${path.resolve(pastaBase)}\n`);

  // Buscar todos os PDFs
  const pdfs = [];
  let pastasEncontradas = [];

  try {
    const entries = fs.readdirSync(pastaBase, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const nomeUpper = entry.name.toUpperCase();
      let slug = PASTA_DISCIPLINA[nomeUpper] || PASTA_DISCIPLINA[entry.name];

      // Match parcial
      if (!slug) {
        for (const [key, val] of Object.entries(PASTA_DISCIPLINA)) {
          if (nomeUpper.includes(key) || key.includes(nomeUpper)) {
            slug = val;
            break;
          }
        }
      }

      if (!slug) {
        const arquivosPdf = fs.readdirSync(path.join(pastaBase, entry.name))
          .filter(f => f.toLowerCase().endsWith('.pdf'));
        if (arquivosPdf.length > 0) {
          console.log(`  ⚠️ Pasta não mapeada: "${entry.name}" (${arquivosPdf.length} PDFs)`);
        }
        continue;
      }

      pastasEncontradas.push(entry.name);
      const pastaPath = path.join(pastaBase, entry.name);
      const arquivos = fs.readdirSync(pastaPath)
        .filter(f => f.toLowerCase().endsWith('.pdf'))
        .sort();

      for (const arquivo of arquivos) {
        pdfs.push({
          caminho: path.join(pastaPath, arquivo),
          disciplinaSlug: slug,
          nome: arquivo,
          pasta: entry.name,
        });
      }
    }
  } catch (err) {
    console.error(`❌ Erro ao ler pasta: ${err.message}`);
    process.exit(1);
  }

  console.log(`📁 ${pastasEncontradas.length} disciplinas reconhecidas`);
  console.log(`📄 ${pdfs.length} PDFs encontrados\n`);

  if (pdfs.length === 0) {
    console.log('❌ Nenhum PDF encontrado.');
    const dirs = fs.readdirSync(pastaBase, { withFileTypes: true })
      .filter(d => d.isDirectory()).map(d => d.name);
    console.log('   Pastas encontradas:', dirs.join(', '));
    process.exit(1);
  }

  // Processar cada PDF
  for (let pdfIdx = 0; pdfIdx < pdfs.length; pdfIdx++) {
    const pdf = pdfs[pdfIdx];
    const progresso = `[${pdfIdx + 1}/${pdfs.length}]`;

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`${progresso} 📖 ${pdf.nome}`);
    console.log(`  📁 ${pdf.pasta} → ${pdf.disciplinaSlug}`);

    try {
      // 1. Ler PDF
      const dataBuffer = fs.readFileSync(pdf.caminho);
      const pdfData = await pdfParse(dataBuffer);
      const textoCompleto = pdfData.text || '';
      const numPaginas = pdfData.numpages || 1;

      console.log(`  📄 ${numPaginas} páginas | ${textoCompleto.length} caracteres`);

      if (textoCompleto.length > 0) {
        const amostra = textoCompleto.substring(0, 150).replace(/\n/g, ' ').trim();
        console.log(`  🔍 "${amostra.substring(0, 80)}..."`);
      }

      if (textoCompleto.length < CONFIG.MIN_CHARS_PDF) {
        console.log(`  ⏭️ Pouco texto (${textoCompleto.length} chars). Pulando.`);
        stats.pdfsIgnorados++;
        continue;
      }

      // 2. Buscar disciplina no banco
      const disciplina = await prisma.disciplina.findUnique({
        where: { slug: pdf.disciplinaSlug },
      });

      if (!disciplina) {
        console.log(`  ⚠️ Disciplina "${pdf.disciplinaSlug}" não encontrada. Pulando.`);
        stats.pdfsIgnorados++;
        continue;
      }

      // 3. Criar/atualizar caderno
      const cadernoId = `caderno-${pdf.disciplinaSlug}-${pdf.nome.replace('.pdf', '').replace(/\s+/g, '-')}`;
      const caderno = await prisma.caderno.upsert({
        where: { id: cadernoId },
        create: {
          id: cadernoId,
          titulo: pdf.nome.replace('.pdf', ''),
          arquivo: pdf.nome,
          totalPaginas: numPaginas,
          disciplinaId: disciplina.id,
        },
        update: { totalPaginas: numPaginas },
      });

      // 4. Dividir texto em blocos
      const inicioConteudo = Math.min(
        Math.floor(textoCompleto.length * CONFIG.PULAR_INICIO_PCT),
        1000
      );
      const textoUtil = textoCompleto.substring(inicioConteudo);
      const blocos = dividirEmBlocos(textoUtil, CONFIG.TAMANHO_BLOCO, CONFIG.MIN_CHARS_BLOCO);

      console.log(`  📦 ${blocos.length} blocos para processar`);

      let questoesCaderno = 0;

      for (let i = 0; i < blocos.length; i++) {
        const numPagina = Math.round(((i + 1) / blocos.length) * numPaginas) || 1;
        const texto = blocos[i];

        // Salvar conteúdo extraído
        try {
          await prisma.conteudoExtraido.upsert({
            where: { cadernoId_pagina: { cadernoId: caderno.id, pagina: i + 1 } },
            create: { cadernoId: caderno.id, pagina: i + 1, texto },
            update: { texto },
          });
        } catch (e) { /* ignorar */ }

        // Gerar questões com Ollama
        const questoes = await gerarQuestoesComRetry(texto, disciplina.nome, numPagina);

        if (questoes.length > 0) {
          for (const q of questoes) {
            try {
              if (!q.enunciado || !q.alternativas || !Array.isArray(q.alternativas)) continue;
              if (q.alternativas.length < 4) continue;

              // Normalizar campo "correta" (string "true"/"false" → boolean)
              for (const alt of q.alternativas) {
                if (typeof alt.correta === 'string') {
                  alt.correta = alt.correta.toLowerCase() === 'true';
                }
                if (alt.correct !== undefined && alt.correta === undefined) {
                  alt.correta = !!alt.correct;
                }
              }

              // Verificar que tem pelo menos 1 correta
              const corretas = q.alternativas.filter(a => a.correta === true);
              if (corretas.length === 0) {
                // Tentar marcar a primeira como correta se nenhuma marcada
                q.alternativas[0].correta = true;
              } else if (corretas.length > 1) {
                // Manter só a primeira correta
                let found = false;
                for (const alt of q.alternativas) {
                  if (alt.correta && !found) { found = true; }
                  else { alt.correta = false; }
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
              questoesCaderno++;
            } catch (e) { /* questão duplicada */ }
          }
        }

        const elapsed = ((Date.now() - stats.inicio) / 1000 / 60).toFixed(1);
        process.stdout.write(
          `  📝 Bloco ${i + 1}/${blocos.length} → ${questoesCaderno} questões | Total geral: ${stats.totalQuestoes + questoesCaderno} | ${elapsed}min\r`
        );

        // Pequena pausa para não sobrecarregar
        if (i < blocos.length - 1) {
          await sleep(CONFIG.DELAY_ENTRE_CHAMADAS);
        }
      }

      // Marcar caderno como processado
      await prisma.caderno.update({
        where: { id: caderno.id },
        data: { processado: true },
      });

      stats.totalQuestoes += questoesCaderno;
      stats.pdfsProcessados++;
      stats.questoesPorDisciplina[disciplina.nome] =
        (stats.questoesPorDisciplina[disciplina.nome] || 0) + questoesCaderno;

      console.log(`\n  ✅ ${questoesCaderno} questões | Acumulado: ${stats.totalQuestoes}`);

    } catch (err) {
      console.error(`\n  ❌ Erro: ${err.message}`);
      stats.pdfsErro++;
    }
  }

  // Relatório final
  const duracaoMin = ((Date.now() - stats.inicio) / 1000 / 60).toFixed(1);
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`╔════════════════════════════════════════════════╗`);
  console.log(`║  ✅ PROCESSAMENTO CONCLUÍDO                    ║`);
  console.log(`╠════════════════════════════════════════════════╣`);
  console.log(`║  📄 PDFs processados: ${stats.pdfsProcessados}`);
  console.log(`║  ⏭️ PDFs ignorados:   ${stats.pdfsIgnorados}`);
  console.log(`║  ❌ PDFs com erro:    ${stats.pdfsErro}`);
  console.log(`║  📦 Blocos processados: ${stats.blocosProcessados}`);
  console.log(`║  📝 TOTAL QUESTÕES:   ${stats.totalQuestoes}`);
  console.log(`║  ⏱️ Tempo total:      ${duracaoMin} minutos`);
  console.log(`╠════════════════════════════════════════════════╣`);
  console.log(`║  📊 QUESTÕES POR DISCIPLINA:`);
  const sorted = Object.entries(stats.questoesPorDisciplina).sort((a, b) => b[1] - a[1]);
  for (const [disc, count] of sorted) {
    console.log(`║    ${disc}: ${count}`);
  }
  console.log(`╚════════════════════════════════════════════════╝\n`);

  await prisma.$disconnect();
}

// Dividir texto em blocos inteligentes
function dividirEmBlocos(texto, tamanho, minimo) {
  const blocos = [];
  let pos = 0;

  while (pos < texto.length) {
    let fim = Math.min(pos + tamanho, texto.length);

    if (fim < texto.length) {
      const proximaQuebra = texto.indexOf('\n\n', fim - 300);
      if (proximaQuebra > 0 && proximaQuebra < fim + 500) {
        fim = proximaQuebra;
      } else {
        const ultimoPonto = texto.lastIndexOf('. ', fim);
        if (ultimoPonto > pos + minimo) {
          fim = ultimoPonto + 1;
        }
      }
    }

    const bloco = texto.substring(pos, fim).trim();
    if (bloco.length >= minimo) {
      blocos.push(bloco);
    }
    pos = fim;
  }

  return blocos;
}

// Gerar questões com retry
async function gerarQuestoesComRetry(texto, disciplina, pagina) {
  for (let tentativa = 1; tentativa <= CONFIG.MAX_RETRIES; tentativa++) {
    try {
      const questoes = await gerarQuestoes(texto, disciplina, pagina);
      stats.blocosProcessados++;
      return questoes;
    } catch (err) {
      if (tentativa < CONFIG.MAX_RETRIES) {
        console.log(`\n  ⚠️ Tentativa ${tentativa}: ${err.message.substring(0, 100)}`);
        await sleep(2000);
      } else {
        console.log(`\n  ❌ Bloco falhou: ${err.message.substring(0, 100)}`);
        stats.blocosErro++;
        return [];
      }
    }
  }
  return [];
}

async function gerarQuestoes(texto, disciplina, pagina) {
  const prompt = `Você é um professor especialista em ${disciplina} para concursos de Magistratura Estadual no Brasil.

TAREFA: Gere exatamente ${CONFIG.QUESTOES_POR_BLOCO} questões objetivas com base no conteúdo jurídico abaixo.

REGRAS OBRIGATÓRIAS:
- Cada questão tem 4 alternativas (A, B, C, D), sendo EXATAMENTE 1 correta
- Questões devem testar conhecimento profundo
- Inclua questões FACIL, MEDIO e DIFICIL
- A explicação deve citar fundamento legal
- O tópico deve ser específico

CONTEÚDO (página ~${pagina}):
${texto.substring(0, 2500)}

RESPONDA SOMENTE com JSON válido. Nenhum texto antes ou depois. Apenas o array JSON:
[{"enunciado":"pergunta aqui","topico":"tópico específico","dificuldade":"MEDIO","alternativas":[{"letra":"A","texto":"opção A","correta":false},{"letra":"B","texto":"opção B","correta":true},{"letra":"C","texto":"opção C","correta":false},{"letra":"D","texto":"opção D","correta":false}],"explicacao":"explicação com base legal"}]`;

  const response = await fetch(`${CONFIG.OLLAMA_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: CONFIG.MODELO,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 4096,
      },
      format: 'json',
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}: ${await response.text()}`);
  }

  const data = await response.json();
  const content = data.response || '';

  if (!content.trim()) return [];

  // Tentar extrair JSON da resposta (llama3 retorna formatos variados)
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    // Limpar possíveis caracteres extras
    const cleaned = content.replace(/```json?\s*/g, '').replace(/```\s*/g, '').trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch (e2) {
      // Tentar encontrar array JSON
      const match = cleaned.match(/\[[\s\S]*\]/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch (e3) { return []; }
      } else {
        const objMatch = cleaned.match(/\{[\s\S]*\}/);
        if (objMatch) {
          try {
            const obj = JSON.parse(objMatch[0]);
            parsed = obj.questoes || obj.questions || Object.values(obj).find(v => Array.isArray(v)) || [];
          } catch (e4) { return []; }
        } else {
          return [];
        }
      }
    }
  }

  // Extrair array de questões de qualquer formato
  let questoes = [];
  if (Array.isArray(parsed)) {
    questoes = parsed;
  } else if (typeof parsed === 'object' && parsed !== null) {
    // Buscar qualquer propriedade que seja um array
    questoes = parsed.questoes || parsed.questions || parsed.data || parsed.items || [];
    if (!Array.isArray(questoes)) {
      // Tentar encontrar o primeiro array dentro do objeto
      for (const val of Object.values(parsed)) {
        if (Array.isArray(val) && val.length > 0) {
          questoes = val;
          break;
        }
      }
    }
  }

  // Normalizar campos alternativos que o llama3 pode usar
  questoes = questoes.map(q => ({
    enunciado: q.enunciado || q.question || q.pergunta || q.texto || '',
    topico: q.topico || q.topic || q.tema || q.subject || '',
    dificuldade: (q.dificuldade || q.difficulty || q.nivel || 'MEDIO').toUpperCase(),
    alternativas: (q.alternativas || q.alternatives || q.options || q.opcoes || []).map((a, idx) => ({
      letra: a.letra || a.letter || String.fromCharCode(65 + idx),
      texto: a.texto || a.text || a.content || a.opcao || '',
      correta: a.correta ?? a.correct ?? a.is_correct ?? a.isCorrect ?? false,
    })),
    explicacao: q.explicacao || q.explanation || q.justificativa || q.fundamentacao || '',
  }));

  return questoes;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

main().catch(err => {
  console.error('❌ Erro fatal:', err);
  process.exit(1);
});
