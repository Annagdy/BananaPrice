import Image from 'next/image'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Nav from '../../../components/Nav'
import Footer from '../../../components/Footer'
import LoadingJogo from '../[id]/loadingPage.tsx'
import { capaExemplo } from '../../../components/assets'
import { tema } from '../../../mocks/tema'
import PortaoAdulto from './PortaoAdulto'
import DetalhesJogoClient from './DetalhesJogoClient'
import { urlCapaItad } from '../../../lib/itad.ts'

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type Oferta = {
  idLoja: number
  loja: string | null
  preco: number
  precoOriginal: number
  desconto: number
  url: string | null
}

type JogoResposta = {
  jogo: { id: number; itad_id?: string | number; itadId?: string | number; titulo: string; genero: string | null }
  capa: string | null
  melhorOferta: Oferta | null
  ofertas: Oferta[]
  menorPrecoHistorico: { valor: number; data: string } | null
  dlcs?: Array<{ id: number; titulo: string; preco: number | null; desconto: number }>
}

type Busca = JogoResposta | { bloqueado: true } | null

async function buscarJogo(id: string): Promise<Busca> {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const cookie = (await cookies()).toString()

  const res = await fetch(`${site}/api/v1/games/${encodeURIComponent(id)}`, {
    cache: 'no-store',
    headers: { cookie },
  })

  if (res.status === 403) return { bloqueado: true }
  if (res.status === 404 || res.status === 400) return null
  if (!res.ok) throw new Error('Falha ao carregar o jogo.')
  return res.json()
}

const LINK_EXTERNO = {
  target: '_blank',
  rel: 'noopener noreferrer sponsored',
} as const

async function buscarHistoricoJogo(id: string) {
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const cookie = (await cookies()).toString()

  const res = await fetch(`${site}/api/v1/games/${encodeURIComponent(id)}/history?dias=90`, {
    cache: 'no-store',
    headers: { cookie },
  })

  if (!res.ok) return { series: [] as Array<{ loja: string | null; pontos: Array<{ data: string; valor: number }> }> }
  return res.json()
}

async function ConteudoJogo({ id }: { id: string }) {
  const dados = await buscarJogo(id)
  if (!dados) notFound()
  if ('bloqueado' in dados) return <PortaoAdulto />

  const { jogo, capa, melhorOferta, ofertas, menorPrecoHistorico } = dados
  const historico = await buscarHistoricoJogo(id)
  const dlcs = dados.dlcs ?? []

  const itadId = jogo.itadId ?? jogo.itad_id
  const capaFinal = capa ?? (itadId ? (urlCapaItad(String(itadId)) as string) : null) ?? capaExemplo

  const historicoPrecos = (historico?.series ?? [])
    .flatMap((serie: { loja: string | null; pontos: Array<{ data: string; valor: number }> }) =>
      serie.pontos.map((ponto) => ({
        loja: serie.loja ?? 'Loja',
        data: ponto.data,
        valor: ponto.valor,
      }))
    )
    .sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())

  return (
    <DetalhesJogoClient
      jogo={jogo}
      capaFinal={capaFinal}
      melhorOferta={melhorOferta}
      ofertas={ofertas}
      menorPrecoHistorico={menorPrecoHistorico}
      dlcs={dlcs}
      historicoPrecos={historicoPrecos}
    />
  )
}

export default async function JogoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <Nav logado />
      <div className="h-[5px]" style={{ background: tema.divisor }} />

      <Suspense
        fallback={
          <LoadingJogo />
        }
      >
        <ConteudoJogo id={id} />
      </Suspense>

      <div className="h-[5px]" style={{ background: tema.divisor }} />
      <Footer />
    </div>
  )
}