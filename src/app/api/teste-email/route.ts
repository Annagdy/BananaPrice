// app/api/teste-email/route.ts
import { NextResponse } from 'next/server';
import { enviarEmailAlertaPreco } from '@/lib/email'; // ajuste o caminho

export async function GET() {
  const resultado = await enviarEmailAlertaPreco({
    para: "annabeatriz_2019@outlook.com", // Coloque seu e-mail aqui para receber o teste
    nomeUsuario: "Testador Banana",
    tituloJogo: "Elden Ring",
    preco: 149.90,
    desconto: 35,
    loja: "Steam",
    urlJogo: "http://localhost:3000/jogo/123",
  });

  return NextResponse.json(resultado);
}