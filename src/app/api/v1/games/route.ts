
import { NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { supabase } from '@/lib/supabase.ts';
import { listarCatalogo } from './catalogo';

const execFileAsync = promisify(execFile);

type Jogo = {
  id_jogo: number;
  titulo: string;
  itad_id: string | number;
};

type Promocao = {
  valor_atual: number | null;
  percentual_desconto: number | null;
  atualizado_em: string | null;
  loja: { nome: string } | null;
};

type JogoComPromocoes = Jogo & {
  promocoes: Promocao[];
};

function limparNome(nome: string): string {
  return nome
    .replace(/\bO\s+Gemini\s+disse\b[:,]?\s*/gi, '')
    .replace(/\bIsThereAnyDeal\b/gi, '')
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/[™®©]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizarTitulo(titulo: string): string {
  return limparNome(titulo)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function palavrasImportantes(titulo: string): string[] {
  return normalizarTitulo(titulo)
    .split(' ')
    .filter(palavra => palavra.length > 0);
}

function possuiTodasAsPalavras(
  tituloPesquisado: string,
  tituloBanco: string
): boolean {
  const palavrasPesquisadas = palavrasImportantes(tituloPesquisado);
  const palavrasBanco = new Set(palavrasImportantes(tituloBanco));

  return (
    palavrasPesquisadas.length > 0 &&
    palavrasPesquisadas.every(palavra => palavrasBanco.has(palavra))
  );
}

async function pesquisarNomesOficiais(
  busca: string
): Promise<string[]> {
  const script = path.join(
    process.cwd(),
    'src',
    'app',
    'api',
    'v1',
    'games',
    'pesquisaNomeJogo.py'
  );

  const { stdout } = await execFileAsync(
    'py',
    [script, busca],
    {
      encoding: 'utf8',
      timeout: 120000,
    }
  );

  // Verifica se NOT JOGO aparece em qualquer parte do retorno do Python.
  if (/\bNOT\s+JOGO\b/i.test(stdout)) {
    return [];
  }

  const resultado = JSON.parse(stdout.trim());

  if (resultado.erro) {
    throw new Error(resultado.erro);
  }

  const nomes: string[] = Array.isArray(resultado.nome)
    ? resultado.nome
    : typeof resultado.nome === 'string'
      ? resultado.nome.split(/\r?\n|,/)
      : [];

  const nomesLimpos = [
    ...new Set(
      nomes
        .map(limparNome)
        .filter(
          nome =>
            Boolean(nome) &&
            !/^o\s+gemini\s+disse\b/i.test(nome)
        )
    ),
  ];

  // Verifica se NOT JOGO aparece em qualquer nome retornado.
  if (nomesLimpos.some(nome => /\bNOT\s+JOGO\b/i.test(nome))) {
    return [];
  }

  return nomesLimpos;
}

async function buscarJogosNoSupabase(
  nomesRetornados: string[]
): Promise<
  {
    nomePesquisado: string;
    jogosEncontrados: JogoComPromocoes[];
  }[]
> {
  const resultados: {
    nomePesquisado: string;
    jogosEncontrados: JogoComPromocoes[];
  }[] = [];

  const jogosJaProcessados = new Set<string>();

  for (const nomeOriginal of nomesRetornados) {
    const nome = limparNome(nomeOriginal);
    const palavras = palavrasImportantes(nome);

    console.log('\n======================================');
    console.log('Nome retornado pelo Gemini:', nome);

    if (
      !nome ||
      /^o\s+gemini\s+disse\b/i.test(nome) ||
      palavras.length === 0
    ) {
      console.log('Nome ignorado:', nome);
      continue;
    }

    console.log('Palavras verificadas:', palavras);

    let consulta = supabase
      .from('jogo')
      .select('id_jogo, titulo, itad_id');

    for (const palavra of palavras) {
      consulta = consulta.ilike('titulo', `%${palavra}%`);
    }

    const { data, error } = await consulta.limit(500);

    if (error) {
      console.error(
        `Erro ao consultar "${nome}":`,
        error.message
      );

      resultados.push({
        nomePesquisado: nome,
        jogosEncontrados: [],
      });

      continue;
    }

    const candidatos = (data ?? []) as Jogo[];

    console.log(
      'Candidatos encontrados no banco:',
      candidatos.length
    );

    const jogosAprovados = candidatos.filter(jogo =>
      possuiTodasAsPalavras(nome, jogo.titulo)
    );

    for (const jogo of candidatos) {
      console.log({
        pesquisado: nome,
        candidato: jogo.titulo,
        aceito: possuiTodasAsPalavras(nome, jogo.titulo),
      });
    }

    const jogosComPromocoes: JogoComPromocoes[] = [];

    for (const jogo of jogosAprovados) {
      const chave = String(jogo.id_jogo);

      if (jogosJaProcessados.has(chave)) {
        continue;
      }

      jogosJaProcessados.add(chave);

      const { data: precos, error: erroPrecos } = await supabase
        .from('preco_jogo')
        .select(`
          valor_atual,
          percentual_desconto,
          atualizado_em,
          loja (
            nome
          )
        `)
        .eq('id_jogo', jogo.id_jogo);

      if (erroPrecos) {
        console.error(
          `Erro ao consultar promoções de "${jogo.titulo}":`,
          erroPrecos.message
        );
      }

      const promocoes: Promocao[] = (precos ?? []).map(
        (preco: any) => ({
          valor_atual: preco.valor_atual,
          percentual_desconto: preco.percentual_desconto,
          atualizado_em: preco.atualizado_em,
          loja: Array.isArray(preco.loja)
            ? preco.loja[0] ?? null
            : preco.loja ?? null,
        })
      );

      jogosComPromocoes.push({
        ...jogo,
        promocoes,
      });
    }

    console.log(
      `Jogos aprovados para "${nome}":`,
      jogosComPromocoes.map(jogo => jogo.titulo)
    );

    resultados.push({
      nomePesquisado: nome,
      jogosEncontrados: jogosComPromocoes,
    });
  }

  return resultados;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get('busca')?.trim();

    if (!busca) {
      return listarCatalogo(request);
    }

    console.log('\n======================================');
    console.log('Busca original:', busca);

    const nomesRetornados = await pesquisarNomesOficiais(busca);

    // Se o Python retornar NOT JOGO, informa que nenhum jogo foi encontrado.
    if (nomesRetornados.length === 0) {
      return NextResponse.json({
        mensagem: 'Nenhum jogo foi encontrado.',
      });
    }

    console.log('Nomes válidos retornados:', nomesRetornados);

    const resultados = await buscarJogosNoSupabase(nomesRetornados);

    return NextResponse.json({
      busca,
      totalNomes: nomesRetornados.length,
      resultados,
      jogosEncontrados: resultados.flatMap(
        resultado => resultado.jogosEncontrados
      ),
    });
  } catch (error) {
    console.error('Erro ao pesquisar jogos:', error);

    return NextResponse.json(
      {
        erro: 'Não foi possível pesquisar os jogos.',
        detalhes:
          error instanceof Error
            ? error.message
            : 'Erro desconhecido',
      },
      { status: 500 }
    );
  }
}
