import { supabase, chamarSupabase } from "../lib/supabase.ts/index.ts";
import { notificarQuedaDePreco } from "./notificacoes";

const emAtualizacao = new Set<number>();

function hojeBrasil(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

export async function atualizarPrecosDoJogo(idJogo: number, deals: any[]): Promise<boolean> {
  if (emAtualizacao.has(idJogo)) {
    return false;
  }

  emAtualizacao.add(idJogo);

  try {
    const porLoja = new Map<string, { valor: number; corte: number }>();

    for (const deal of deals) {
      const loja = String(deal?.shop?.name ?? "").trim();
      const valor = Number(deal?.price?.amount);
      const corte = Number(deal?.cut ?? 0);

      if (!loja || !Number.isFinite(valor)) {
        continue;
      }

      const atual = porLoja.get(loja);
      if (!atual || valor < atual.valor) {
        porLoja.set(loja, { valor, corte: Number.isFinite(corte) ? corte : 0 });
      }
    }

    if (porLoja.size === 0) {
      console.log(`[atualizarPrecosDoJogo] Nenhuma loja válida encontrada nos deals.`);
      return false;
    }

    // Consulta os preços salvos ANTES da atualização
    let menorAnterior: number | null = null;
    let descontoAnterior = 0;

    try {
      const precosAnteriores = await chamarSupabase(
        "consultar menor preco anterior",
        () => supabase
          .from("preco_jogo")
          .select("valor_atual, percentual_desconto")
          .eq("id_jogo", idJogo)
          .not("valor_atual", "is", null)
          .order("valor_atual", { ascending: true })
      );

      if (precosAnteriores && precosAnteriores.length > 0) {
        menorAnterior = Number(precosAnteriores[0].valor_atual);
        descontoAnterior = Number(precosAnteriores[0].percentual_desconto ?? 0);
      }
    } catch {
      // Ignora erro de verificação anterior
    }

    // 1) RESOLUÇÃO DE LOJAS (Busca existentes -> Insere novas -> Mapeia IDs)
    const nomesLojas = Array.from(porLoja.keys());
    const idPorNome = new Map<string, number>();

    const lojasExistentes = await chamarSupabase(
      "buscar lojas existentes",
      () => supabase.from("loja").select("id_loja, nome").in("nome", nomesLojas)
    );

    for (const l of lojasExistentes ?? []) {
      idPorNome.set(l.nome, l.id_loja);
    }

    const novasLojas = nomesLojas.filter((nome) => !idPorNome.has(nome));
    if (novasLojas.length > 0) {
      const inseridas = await chamarSupabase(
        "inserir novas lojas",
        () => supabase.from("loja").insert(novasLojas.map((nome) => ({ nome }))).select("id_loja, nome")
      );
      for (const l of inseridas ?? []) {
        idPorNome.set(l.nome, l.id_loja);
      }
    }

    const agora = new Date().toISOString();
    const linhasPreco: Record<string, unknown>[] = [];
    const linhasHistorico: { id_jogo: number; id_loja: number; data: string; valor: number }[] = [];
    const hoje = hojeBrasil();

    for (const [nome, oferta] of porLoja) {
      const idLoja = idPorNome.get(nome);
      if (idLoja === undefined) continue;

      linhasPreco.push({
        id_jogo: idJogo,
        id_loja: idLoja,
        valor_atual: oferta.valor,
        percentual_desconto: oferta.corte,
        atualizado_em: agora
      });

      linhasHistorico.push({ id_jogo: idJogo, id_loja: idLoja, data: hoje, valor: oferta.valor });
    }

    if (linhasPreco.length === 0) {
      console.log(`[atualizarPrecosDoJogo] Falha ao mapear id_loja das ofertas.`);
      return false;
    }

    // 2) Grava Preços Atuais
    await chamarSupabase(
      "gravar preco_jogo",
      () => supabase.from("preco_jogo").upsert(linhasPreco, { onConflict: "id_jogo,id_loja" })
    );

    // Notificações
    let menorNovoValor = Infinity;
    let maiorDesconto = 0;
    let melhorLoja = "";

    for (const [nome, oferta] of porLoja) {
      if (oferta.valor < menorNovoValor) {
        menorNovoValor = oferta.valor;
        maiorDesconto = oferta.corte;
        melhorLoja = nome;
      }
    }

    if (
      Number.isFinite(menorNovoValor) &&
      menorAnterior !== null &&
      (menorNovoValor < menorAnterior || (maiorDesconto > descontoAnterior && maiorDesconto >= 10))
    ) {
      notificarQuedaDePreco({
        idJogo,
        novoPreco: menorNovoValor,
        desconto: maiorDesconto,
        loja: melhorLoja,
        precoAnterior: menorAnterior,
      }).catch((err) =>
        console.error("[atualizarPrecosDoJogo] Erro ao notificar:", err)
      );
    }

    // Remove lojas desatualizadas
    const idsAtuais = linhasPreco.map((l) => l.id_loja as number);
    await chamarSupabase(
      "remover ofertas antigas",
      () => supabase
        .from("preco_jogo")
        .delete()
        .eq("id_jogo", idJogo)
        .not("id_loja", "in", `(${idsAtuais.join(",")})`)
    );

    // 3) Registra Histórico de Preços
    const novas: typeof linhasHistorico = [];
    for (const linha of linhasHistorico) {
      const ultimo = await chamarSupabase(
        "consultar último histórico",
        () => supabase
          .from("preco_historico")
          .select("valor")
          .eq("id_jogo", idJogo)
          .eq("id_loja", linha.id_loja)
          .order("id_historico", { ascending: false })
          .limit(1)
          .maybeSingle()
      );

      if (!ultimo || Number(ultimo.valor) !== linha.valor) {
        novas.push(linha);
      }
    }

    if (novas.length > 0) {
      await chamarSupabase(
        "gravar preco_historico",
        () => supabase.from("preco_historico").insert(novas)
      );
    }

    console.log(`[atualizarPrecosDoJogo] Sucesso ao gravar ${linhasPreco.length} preços para id_jogo: ${idJogo}`);
    return true;

  } catch (erro: any) {
    console.error(`[atualizarPrecosDoJogo] jogo ${idJogo}:`, erro?.message ?? erro);
    return false;
  } finally {
    emAtualizacao.delete(idJogo);
  }
}