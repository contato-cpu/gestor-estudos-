#!/usr/bin/env node
// ============================================
// SEED - Popular banco com disciplinas e editais
// ============================================

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

const DISCIPLINAS = [
  { nome: 'Direito Constitucional', slug: 'constitucional', icone: '⚖️', cor: '#3B82F6', ordem: 1 },
  { nome: 'Direito Penal Geral', slug: 'penal-geral', icone: '🔒', cor: '#EF4444', ordem: 2 },
  { nome: 'Direito Penal Especial', slug: 'penal-especial', icone: '🔐', cor: '#DC2626', ordem: 3 },
  { nome: 'Direito Civil', slug: 'civil', icone: '📜', cor: '#8B5CF6', ordem: 4 },
  { nome: 'Processo Civil', slug: 'processo-civil', icone: '📋', cor: '#7C3AED', ordem: 5 },
  { nome: 'Processo Penal', slug: 'processo-penal', icone: '🏛️', cor: '#B91C1C', ordem: 6 },
  { nome: 'Direito Administrativo', slug: 'administrativo', icone: '🏢', cor: '#F59E0B', ordem: 7 },
  { nome: 'Direito Tributário', slug: 'tributario', icone: '💰', cor: '#10B981', ordem: 8 },
  { nome: 'Direito do Trabalho', slug: 'trabalho', icone: '👷', cor: '#F97316', ordem: 9 },
  { nome: 'Processo do Trabalho', slug: 'processo-trabalho', icone: '⚙️', cor: '#EA580C', ordem: 10 },
  { nome: 'Direito Empresarial', slug: 'empresarial', icone: '🏦', cor: '#6366F1', ordem: 11 },
  { nome: 'Direito Ambiental', slug: 'ambiental', icone: '🌿', cor: '#22C55E', ordem: 12 },
  { nome: 'Direitos Humanos', slug: 'humanos', icone: '✊', cor: '#EC4899', ordem: 13 },
  { nome: 'Criminologia', slug: 'criminologia', icone: '🔍', cor: '#64748B', ordem: 14 },
  { nome: 'Direito Agrário', slug: 'agrario', icone: '🌾', cor: '#84CC16', ordem: 15 },
  { nome: 'Direito Eleitoral', slug: 'eleitoral', icone: '🗳️', cor: '#0EA5E9', ordem: 16 },
  { nome: 'Direito Econômico', slug: 'economico', icone: '📊', cor: '#14B8A6', ordem: 17 },
  { nome: 'Direito Urbanístico', slug: 'urbanistico', icone: '🏙️', cor: '#A855F7', ordem: 18 },
  { nome: 'ECA', slug: 'eca', icone: '👶', cor: '#F472B6', ordem: 19 },
  { nome: 'Direito do Consumidor', slug: 'consumidor', icone: '🛒', cor: '#FB923C', ordem: 20 },
  { nome: 'Direito Financeiro', slug: 'financeiro', icone: '💵', cor: '#34D399', ordem: 21 },
  { nome: 'Direito Internacional Público', slug: 'internacional', icone: '🌍', cor: '#06B6D4', ordem: 22 },
  { nome: 'Execuções Penais', slug: 'execucoes-penais', icone: '⛓️', cor: '#78716C', ordem: 23 },
  { nome: 'Difusos e Coletivos', slug: 'difusos-coletivos', icone: '👥', cor: '#D946EF', ordem: 24 },
  { nome: 'Fazenda Pública em Juízo', slug: 'fazenda-publica', icone: '🏛️', cor: '#0284C7', ordem: 25 },
  { nome: 'Penal e Proc. Penal Militar', slug: 'penal-militar', icone: '🎖️', cor: '#4B5563', ordem: 26 },
  { nome: 'Humanística', slug: 'humanistica', icone: '📖', cor: '#E11D48', ordem: 27 },
  { nome: 'Previdenciário', slug: 'previdenciario', icone: '🏥', cor: '#0D9488', ordem: 28 },
  { nome: 'Princípios e Atribuições do MP', slug: 'mp-atribuicoes', icone: '⚔️', cor: '#7C2D12', ordem: 29 },
];

const EDITAIS = [
  {
    nome: 'TJ-SP 2025',
    orgao: 'TJ-SP',
    ano: 2025,
    cargo: 'Juiz Substituto',
    disciplinas: [
      { slug: 'constitucional', peso: 3, questoesPrevistas: 15 },
      { slug: 'civil', peso: 3, questoesPrevistas: 15 },
      { slug: 'processo-civil', peso: 2, questoesPrevistas: 10 },
      { slug: 'penal-geral', peso: 2, questoesPrevistas: 10 },
      { slug: 'processo-penal', peso: 2, questoesPrevistas: 10 },
      { slug: 'administrativo', peso: 2, questoesPrevistas: 10 },
      { slug: 'tributario', peso: 1, questoesPrevistas: 5 },
      { slug: 'empresarial', peso: 1, questoesPrevistas: 5 },
      { slug: 'ambiental', peso: 1, questoesPrevistas: 5 },
      { slug: 'humanistica', peso: 1, questoesPrevistas: 5 },
    ],
  },
  {
    nome: 'TJ-MG 2025',
    orgao: 'TJ-MG',
    ano: 2025,
    cargo: 'Juiz Substituto',
    disciplinas: [
      { slug: 'constitucional', peso: 3, questoesPrevistas: 12 },
      { slug: 'civil', peso: 3, questoesPrevistas: 12 },
      { slug: 'processo-civil', peso: 2, questoesPrevistas: 10 },
      { slug: 'penal-geral', peso: 2, questoesPrevistas: 10 },
      { slug: 'administrativo', peso: 2, questoesPrevistas: 8 },
      { slug: 'trabalho', peso: 1, questoesPrevistas: 5 },
    ],
  },
  {
    nome: 'MP-SP 2025',
    orgao: 'MP-SP',
    ano: 2025,
    cargo: 'Promotor de Justiça',
    disciplinas: [
      { slug: 'constitucional', peso: 3, questoesPrevistas: 15 },
      { slug: 'penal-geral', peso: 3, questoesPrevistas: 15 },
      { slug: 'processo-penal', peso: 3, questoesPrevistas: 15 },
      { slug: 'difusos-coletivos', peso: 2, questoesPrevistas: 10 },
      { slug: 'mp-atribuicoes', peso: 2, questoesPrevistas: 10 },
    ],
  },
];

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // 1. Criar disciplinas
  console.log('📚 Criando disciplinas...');
  for (const disc of DISCIPLINAS) {
    await prisma.disciplina.upsert({
      where: { slug: disc.slug },
      create: disc,
      update: { nome: disc.nome, icone: disc.icone, cor: disc.cor, ordem: disc.ordem },
    });
  }
  console.log(`  ✅ ${DISCIPLINAS.length} disciplinas criadas\n`);

  // 2. Criar editais
  console.log('📋 Criando editais...');
  for (const editalData of EDITAIS) {
    const edital = await prisma.edital.upsert({
      where: { id: `edital-${editalData.orgao.toLowerCase()}-${editalData.ano}` },
      create: {
        id: `edital-${editalData.orgao.toLowerCase()}-${editalData.ano}`,
        nome: editalData.nome,
        orgao: editalData.orgao,
        ano: editalData.ano,
        cargo: editalData.cargo,
      },
      update: { nome: editalData.nome, cargo: editalData.cargo },
    });

    for (const disc of editalData.disciplinas) {
      const disciplina = await prisma.disciplina.findUnique({ where: { slug: disc.slug } });
      if (disciplina) {
        await prisma.editalDisciplina.upsert({
          where: { editalId_disciplinaId: { editalId: edital.id, disciplinaId: disciplina.id } },
          create: {
            editalId: edital.id,
            disciplinaId: disciplina.id,
            peso: disc.peso,
            questoesPrevistas: disc.questoesPrevistas,
          },
          update: { peso: disc.peso, questoesPrevistas: disc.questoesPrevistas },
        });
      }
    }
    console.log(`  ✅ ${editalData.nome} - ${editalData.disciplinas.length} disciplinas`);
  }

  console.log('\n🎉 Seed concluído com sucesso!');
  await prisma.$disconnect();
}

main().catch(console.error);
