'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type Ponto = { data: string; valor: number }

type Serie = {
  idLoja: number
  loja: string | null
  pontos: Ponto[]
  resumo: { atual: number; menor: Ponto; maior: Ponto }
}

type Resposta = { menorGeral: Ponto | null; series: Serie[] }

const PERIODOS = [
  { rotulo: '30 dias', dias: 30 },
  { rotulo: '90 dias', dias: 90 },
  { rotulo: '1 ano', dias: 365 },
  { rotulo: 'Tudo', dias: 3650 },
]

/* Cores bem distintas entre si (as 5 primeiras são as lojas mais baratas, que aparecem por padrão) */
const CORES = [
  '#ffd21a', '#4cc9f0', '#ff6b6b', '#7bd88f', '#c39bff',
  '#ff9f45', '#f783ac', '#a3e635', '#38bdf8', '#e5e7eb',
]

/* Quantas lojas aparecem no gráfico por padrão (as mais baratas hoje) */
const LOJAS_POR_PADRAO = 3

/* Quantos botões de loja aparecem antes de "Ver todas" */
const BOTOES_VISIVEIS = 6

const brl = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const dataBr = (iso: string) => iso.split('-').reverse().join('/')
const tempo = (iso: string) => new Date(`${iso}T12:00:00`).getTime()

/* Histórico de preços de um jogo: gráfico em degraus (o preço fica igual até mudar), com seletor de período,
resumo, escolha das lojas exibidas e lista das últimas mudanças.

Por padrão mostra só as 3 lojas mais baratas, porque com muitas lojas as linhas se sobrepõem e uma loja cara
estica a escala e achata as demais. As outras podem ser ligadas pelos botões.

@param idJogo jogo.id_jogo (lê GET /api/v1/games/[id]/history). */
export default function HistoricoPrecos({ idJogo }: { idJogo: number }) {
  const [dias, setDias] = useState(90)
  const [dados, setDados] = useState<Resposta | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  // null = ainda não mexeu: vale o padrão (as mais baratas). Depois guarda os ids escolhidos.
  const [escolhidas, setEscolhidas] = useState<number[] | null>(null)
  const [verTodas, setVerTodas] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    setCarregando(true)
    setErro(null)

    fetch(`/api/v1/games/${idJogo}/history?dias=${dias}`, {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (res) => {
        const json = await res.json().catch(() => null)
        if (!res.ok) throw new Error(json?.error ?? 'Erro ao carregar o histórico.')
        setDados(json)
      })
      .catch((e: Error) => {
        if (e.name !== 'AbortError') setErro(e.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setCarregando(false)
      })

    return () => controller.abort()
  }, [idJogo, dias])

  // lojas da mais barata para a mais cara (hoje); a cor de cada uma segue essa ordem
  const series = useMemo(
    () => [...(dados?.series ?? [])].sort((a, b) => a.resumo.atual - b.resumo.atual),
    [dados]
  )

  const idsVisiveis = escolhidas ?? series.slice(0, LOJAS_POR_PADRAO).map((s) => s.idLoja)
  const visiveis = series.filter((s) => idsVisiveis.includes(s.idLoja))
  const corDe = (s: Serie) => CORES[series.indexOf(s) % CORES.length]

  const alternar = (id: number) =>
    setEscolhidas(idsVisiveis.includes(id) ? idsVisiveis.filter((x) => x !== id) : [...idsVisiveis, id])

  // Uma linha por data, repetindo o último valor de cada loja (é isso que faz o degrau)
  const linhas = useMemo(() => {
    const datas = Array.from(new Set(visiveis.flatMap((s) => s.pontos.map((p) => p.data)))).sort()
    const ultimoPorLoja: Record<number, number | undefined> = {}

    return datas.map((data) => {
      const linha: Record<string, number | string | undefined> = { t: tempo(data), data }

      for (const s of visiveis) {
        const doDia = s.pontos.filter((p) => p.data === data)
        if (doDia.length) ultimoPorLoja[s.idLoja] = doDia[doDia.length - 1].valor
        linha[`l${s.idLoja}`] = ultimoPorLoja[s.idLoja]
      }

      return linha
    })
  }, [visiveis])

  // Escala do eixo Y calculada só com as lojas exibidas, com folga para as linhas não colarem nas bordas
  const dominio = useMemo<[number, number]>(() => {
    const valores = visiveis.flatMap((s) => s.pontos.map((p) => p.valor))
    if (valores.length === 0) return [0, 10]

    const min = Math.min(...valores)
    const max = Math.max(...valores)
    const folga = Math.max((max - min) * 0.15, max * 0.05, 1)

    return [Math.max(0, Math.floor(min - folga)), Math.ceil(max + folga)]
  }, [visiveis])

  // Resumo calculado sobre as lojas exibidas (o mesmo que o gráfico mostra)
  const resumo = useMemo(() => {
    if (visiveis.length === 0) return null

    let menor = visiveis[0].resumo.menor
    let maior = visiveis[0].resumo.maior

    for (const s of visiveis) {
      if (s.resumo.menor.valor < menor.valor) menor = s.resumo.menor
      if (s.resumo.maior.valor > maior.valor) maior = s.resumo.maior
    }

    return { atual: Math.min(...visiveis.map((s) => s.resumo.atual)), menor, maior }
  }, [visiveis])

  // Últimas mudanças de preço das lojas exibidas
  const mudancas = useMemo(() => {
    const lista: { loja: string | null; data: string; de: number; para: number }[] = []

    for (const s of visiveis) {
      for (let i = 1; i < s.pontos.length; i++) {
        const antes = s.pontos[i - 1]
        const depois = s.pontos[i]
        if (antes.valor !== depois.valor) {
          lista.push({ loja: s.loja, data: depois.data, de: antes.valor, para: depois.valor })
        }
      }
    }

    return lista.sort((a, b) => b.data.localeCompare(a.data)).slice(0, 8)
  }, [visiveis])

  // Datas distintas em todo o histórico (para avisar quando ele ainda é curto)
  const todasDatas = Array.from(new Set(series.flatMap((s) => s.pontos.map((p) => p.data)))).sort()

  const botoes = verTodas ? series : series.slice(0, BOTOES_VISIVEIS)

  return (
    <section aria-label="Histórico de preços" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-head text-2xl font-extrabold text-bp-primary">Histórico de preços</h2>

        <div className="flex flex-wrap gap-2">
          {PERIODOS.map((p) => (
            <button
              key={p.dias}
              type="button"
              onClick={() => setDias(p.dias)}
              aria-pressed={dias === p.dias}
              className={`cursor-pointer rounded-[9px] px-3 py-1.5 text-sm transition ${
                dias === p.dias
                  ? 'bg-bp-primary text-bp-neutral'
                  : 'border border-bp-muted text-bp-muted hover:brightness-125'
              }`}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
      </div>

      {carregando ? (
        <p className="py-10 text-center text-bp-muted">Carregando histórico...</p>
      ) : erro ? (
        <p role="alert" className="py-10 text-center text-red-400">
          {erro}
        </p>
      ) : series.length === 0 ? (
        <p className="py-10 text-center text-bp-muted">Ainda não há histórico de preços para este jogo.</p>
      ) : (
        <>
          {/* Resumo (das lojas exibidas) */}
          {resumo && (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-3">
              <Cartao rotulo="Menor preço atual" valor={brl(resumo.atual)} />
              <Cartao rotulo="Menor já registrado" valor={brl(resumo.menor.valor)} detalhe={dataBr(resumo.menor.data)} />
              <Cartao rotulo="Maior no período" valor={brl(resumo.maior.valor)} detalhe={dataBr(resumo.maior.data)} />
            </div>
          )}

          {/* Lojas: clique para mostrar ou ocultar no gráfico */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-bp-muted/70">
              Mostrando as {LOJAS_POR_PADRAO} lojas mais baratas. Clique para incluir ou tirar uma loja.
            </span>

            <div className="flex flex-wrap gap-2">
              {botoes.map((s) => {
                const ligada = idsVisiveis.includes(s.idLoja)
                return (
                  <button
                    key={s.idLoja}
                    type="button"
                    onClick={() => alternar(s.idLoja)}
                    aria-pressed={ligada}
                    className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                      ligada ? 'border-bp-muted text-bp-muted' : 'border-bp-muted/40 text-bp-muted/50'
                    }`}
                  >
                    <i className="size-2.5 rounded-full" style={{ background: ligada ? corDe(s) : '#666' }} />
                    {s.loja ?? `Loja ${s.idLoja}`}
                    <span className="text-xs opacity-70">{brl(s.resumo.atual)}</span>
                  </button>
                )
              })}

              {series.length > BOTOES_VISIVEIS && (
                <button
                  type="button"
                  onClick={() => setVerTodas((v) => !v)}
                  className="cursor-pointer rounded-full border border-dashed border-bp-muted px-3 py-1 text-sm text-bp-muted transition hover:brightness-125"
                >
                  {verTodas ? 'Mostrar menos' : `Ver todas (${series.length})`}
                </button>
              )}
            </div>
          </div>

          {visiveis.length === 0 ? (
            <p className="py-10 text-center text-bp-muted">Escolha pelo menos uma loja para ver o gráfico.</p>
          ) : (
            <div className="h-[320px] w-full rounded-[13px] bg-bp-neutral p-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={linhas} margin={{ top: 10, right: 20, bottom: 8, left: 0 }}>
                  <CartesianGrid stroke="#ffffff18" vertical={false} />
                  <XAxis
                    dataKey="t"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(t: number) =>
                      new Date(t).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                    }
                    stroke="#b9ad90"
                    fontSize={12}
                    padding={{ left: 8, right: 8 }}
                  />
                  <YAxis
                    domain={dominio}
                    allowDecimals={false}
                    tickCount={5}
                    tickFormatter={(v: number) => `R$ ${Math.round(v)}`}
                    stroke="#b9ad90"
                    fontSize={12}
                    width={64}
                  />
                  <Tooltip
                    contentStyle={{ background: '#2a211e', border: '1px solid #3d322e', borderRadius: 10 }}
                    labelFormatter={(t) => new Date(Number(t)).toLocaleDateString('pt-BR')}
                    formatter={(v, nome) => [brl(Number(v)), String(nome)]}
                  />
                  {resumo && (
                    <ReferenceLine
                      y={resumo.menor.valor}
                      stroke="#7bd88f"
                      strokeDasharray="4 4"
                      label={{ value: 'Menor preço', fill: '#7bd88f', fontSize: 11, position: 'insideTopRight' }}
                    />
                  )}
                  {visiveis.map((s) => (
                    <Line
                      key={s.idLoja}
                      type="stepAfter"
                      dataKey={`l${s.idLoja}`}
                      name={s.loja ?? `Loja ${s.idLoja}`}
                      stroke={corDe(s)}
                      strokeWidth={2.5}
                      dot={linhas.length <= 3 ? { r: 4 } : false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {todasDatas.length < 5 && (
            <p className="text-xs text-bp-muted/70">
              O histórico deste jogo começou em {dataBr(todasDatas[0])}. Ele fica mais completo conforme os
              preços são atualizados.
            </p>
          )}

          {/* Últimas mudanças */}
          {mudancas.length > 0 && (
            <div className="rounded-[13px] bg-bp-neutral p-4">
              <h3 className="pb-2 font-head text-lg font-extrabold text-bp-muted">Últimas mudanças</h3>
              <ul className="flex list-none flex-col gap-1.5 text-sm text-bp-muted">
                {mudancas.map((m, i) => (
                  <li key={i} className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      {dataBr(m.data)} · {m.loja ?? 'Loja'}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-bp-muted/60 line-through">{brl(m.de)}</span>
                      <strong className={m.para < m.de ? 'text-[#7bd88f]' : 'text-[#ff8a8e]'}>{brl(m.para)}</strong>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}

function Cartao({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-[13px] bg-bp-neutral p-4">
      <span className="text-sm text-bp-muted/70">{rotulo}</span>
      <strong className="font-head text-xl text-bp-primary">{valor}</strong>
      {detalhe && <span className="text-xs text-bp-muted/60">{detalhe}</span>}
    </div>
  )
}