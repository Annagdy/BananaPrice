import { NextResponse } from 'next/server'
import { execFile } from 'child_process'
import { promisify } from 'util'
import { listarCatalogo } from './catalogo'
import path from 'path'

const execFileAsync = promisify(execFile)

async function pesquisarGoogle(busca: string): Promise<string[]> {
  const script = path.join(
    process.cwd(),
    'src',
    'app',
    'api',
    'v1',
    'games',
    'pesquisaNomeJogo.py'
  )

  const { stdout } = await execFileAsync(
    'py',
    [script, busca],
    { encoding: 'utf8' }
  )

  const resultado = JSON.parse(stdout)

  if (resultado.erro) {
    throw new Error(resultado.erro)
  }

  return resultado.nome
    .replace(/^O Gemini disse\s*:?\s*/i, '')
    .split(',')
    .map((nome: string) => nome.trim())
    .filter((nome: string) => nome.length > 0)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // sem "busca" => catálogo com filtros (RF06). Com "busca" => pesquisa por nome (código original)
    if (!searchParams.has('busca')) {
      return listarCatalogo(request)
    }
    
    const busca = searchParams.get('busca')?.trim()

    if (!busca) {
      return NextResponse.json(
        { erro: 'Informe o nome do jogo.' },
        { status: 400 }
      )
    }

    const nomesJogos = await pesquisarGoogle(busca)

    console.log('Jogo pesquisado:', busca)
    console.log('Nomes oficiais:', nomesJogos)

    return NextResponse.json({
      nomes: nomesJogos.join(', '),
    })
  } catch (erro) {
    console.error('Erro ao pesquisar jogo:', erro)

    return NextResponse.json(
      { erro: 'Não foi possível pesquisar o jogo.' },
      { status: 500 }
    )
  }
}