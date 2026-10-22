import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase.ts/server";
import { supabase as supabaseAdmin } from "@/lib/supabase.ts";

/*
Descobre o id_usuario (tabela "usuario") de quem está logado.

@returns O id_usuario, ou null se não houver sessão ou o usuário não existir na tabela.
*/
async function usuarioLogado(): Promise<number | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabaseAdmin
    .from("usuario")
    .select("id_usuario")
    .eq("auth_id", user.id)
    .maybeSingle();

  return data?.id_usuario ?? null;
}

/*
GET /api/v1/wishlist (RF10): lista a wishlist do usuário logado.

Para cada jogo devolve a melhor oferta atual (menor valor_atual em preco_jogo). O preço original
é calculado a partir do valor atual e do percentual de desconto.

@returns 200 { jogos: [{ id, nome, precoOriginal, precoComDesconto, desconto, loja, url }] };
         401 não autenticado; 500 erro ao ler o banco.
*/
export async function GET() {
  const idUsuario = await usuarioLogado();
  if (idUsuario === null) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: lista } = await supabaseAdmin
    .from("lista_desejo")
    .select("id_lista")
    .eq("id_usuario", idUsuario)
    .maybeSingle();
  if (!lista) return NextResponse.json({ jogos: [] });

  const { data: itens, error } = await supabaseAdmin
    .from("lista_jogo")
    .select("jogo ( id_jogo, titulo, slug, genero )")
    .eq("id_lista", lista.id_lista);
  if (error) {
    console.error("[wishlist GET] lista_jogo:", error);
    return NextResponse.json({ error: "Não foi possível carregar a lista." }, { status: 500 });
  }

  const jogos = (itens ?? []).map((i: any) => i.jogo).filter(Boolean);

  const ids = jogos.map((j: any) => j.id_jogo);
  const { data: precos } = ids.length
    ? await supabaseAdmin
        .from("preco_jogo")
        .select("id_jogo, valor_atual, percentual_desconto, loja ( nome )")
        .in("id_jogo", ids)
    : { data: [] };

  const resultado = jogos.map((j: any) => {
    const melhor: any = (precos ?? [])
        .filter((p: any) => p.id_jogo === j.id_jogo && p.valor_atual != null)
        .sort((a: any, b: any) => a.valor_atual - b.valor_atual)[0];

    const atual: number | null = melhor?.valor_atual != null ? Number(melhor.valor_atual) : null;
    const desconto = Number(melhor?.percentual_desconto ?? 0);
    const original =
        atual !== null && desconto > 0 && desconto < 100
        ? Math.round((atual / (1 - desconto / 100)) * 100) / 100
        : atual;

    const lojaRel = melhor?.loja;
    const nomeLoja: string | null = Array.isArray(lojaRel)
        ? (lojaRel[0]?.nome ?? null)
        : (lojaRel?.nome ?? null);

        return {
            id: j.id_jogo,
            nome: j.titulo,
            precoOriginal: original,
            precoComDesconto: atual,
            desconto,
            loja: nomeLoja,
            url: `/jogos/${j.id_jogo}`, // página interna do jogo (detalhe + comparação de preços)
        };
    });

  return NextResponse.json({ jogos: resultado });
}

/*
POST /api/v1/wishlist (RF10): adiciona um jogo à wishlist. Cria a lista do usuário se ainda
não existir. Adicionar um jogo repetido não gera erro.

@body { idJogo } id_jogo existente na tabela "jogo".
@returns 201 { ok }; 400 idJogo inválido; 401 não autenticado; 404 jogo não encontrado; 500 erro no banco.
*/
export async function POST(request: Request) {
  const idUsuario = await usuarioLogado();
  if (idUsuario === null) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const idJogo = Number(body?.idJogo);
  if (!Number.isInteger(idJogo) || idJogo <= 0) {
    return NextResponse.json({ error: "idJogo inválido." }, { status: 400 });
  }

  // o jogo precisa existir no catálogo
  const { data: jogo } = await supabaseAdmin
    .from("jogo")
    .select("id_jogo")
    .eq("id_jogo", idJogo)
    .maybeSingle();
  if (!jogo) {
    return NextResponse.json({ error: "Jogo não encontrado." }, { status: 404 });
  }

  // lista do usuário (cria se ainda não existir)
  let { data: lista } = await supabaseAdmin
    .from("lista_desejo")
    .select("id_lista")
    .eq("id_usuario", idUsuario)
    .maybeSingle();

  if (!lista) {
    const { data: nova, error } = await supabaseAdmin
      .from("lista_desejo")
      .insert({ id_usuario: idUsuario })
      .select("id_lista")
      .single();
    if (error || !nova) {
      console.error("[wishlist POST] criar lista:", error);
      return NextResponse.json({ error: "Não foi possível criar a lista." }, { status: 500 });
    }
    lista = nova;
  }

  const { error } = await supabaseAdmin
    .from("lista_jogo")
    .upsert(
      { id_lista: lista.id_lista, id_jogo: idJogo },
      { onConflict: "id_lista,id_jogo", ignoreDuplicates: true }
    );
  if (error) {
    console.error("[wishlist POST] lista_jogo:", error);
    return NextResponse.json({ error: "Não foi possível adicionar." }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}