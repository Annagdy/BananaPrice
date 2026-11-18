import Link from 'next/link'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'
import Divisor from '../../components/Divisor'

export const metadata = {
  title: 'Termos de Uso | BananaPrice',
  description: 'Termos e condições de uso da plataforma BananaPrice.',
}

export default function TermosDeUsoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <header className="sticky top-0 z-50 w-full shrink-0">
        <Nav logado />
      </header>

      <main className="flex-1 px-4 py-8 sm:px-8 sm:py-12 lg:px-16 max-w-4xl mx-auto w-full">
        <div className="rounded-3xl border-2 border-[#3d322e] bg-bp-surface p-6 sm:p-10 shadow-xl space-y-6">
          <div className="border-b border-[#3d322e] pb-4">
            <h1 className="font-head text-3xl sm:text-4xl font-extrabold text-bp-primary">
              Termos de Uso
            </h1>
            <p className="mt-1 text-xs text-bp-muted/60">
              Última atualização: Novembro de 2026
            </p>
          </div>

          <section className="space-y-3 text-sm sm:text-base leading-relaxed text-bp-muted">
            <h2 className="font-head text-xl font-bold text-bp-text">
              1. Aceitação dos Termos
            </h2>
            <p>
              Ao acessar ou utilizar a plataforma <strong className="text-bp-primary">BananaPrice</strong>, você concorda em cumprir e vincular-se a estes Termos de Uso. Caso não concorde com qualquer disposição aqui apresentada, recomendamos não utilizar os nossos serviços.
            </p>
          </section>

          <section className="space-y-3 text-sm sm:text-base leading-relaxed text-bp-muted">
            <h2 className="font-head text-xl font-bold text-bp-text">
              2. Natureza Informativa e Comparador de Preços
            </h2>
            <p>
              O BananaPrice é uma ferramenta agregadora e comparadora independente de preços de jogos eletrônicos. Não somos uma loja direta e não processamos compras de chaves ou licenças de jogos de terceiros.
            </p>
            <p>
              As transações financeiras, entregas de keys e suportes pós-venda são de exclusiva responsabilidade das lojas parceiras e oficiais indicadas (ex: Steam, Nuuvem, Epic Games, GOG, etc.).
            </p>
          </section>

          <section className="space-y-3 text-sm sm:text-base leading-relaxed text-bp-muted">
            <h2 className="font-head text-xl font-bold text-bp-text">
              3. Precisão dos Dados e Promoções
            </h2>
            <p>
              Embora realizemos esforços contínuos e automações de sincronização para manter os preços, cupons e históricos sempre atualizados, divergências de valores podem ocorrer pontualmente devido a flutuações rápidas ou término imprevisto de estoques e promoções nas lojas. O valor oficial sempre será o exibido na página de checkout da loja de destino.
            </p>
          </section>

          <section className="space-y-3 text-sm sm:text-base leading-relaxed text-bp-muted">
            <h2 className="font-head text-xl font-bold text-bp-text">
              4. Contas de Usuário e Segurança
            </h2>
            <p>
              Ao criar uma conta ou autenticar-se via Steam, o usuário é responsável por manter a confidencialidade de suas credenciais de acesso. O BananaPrice não solicita nem armazena senhas de plataformas de terceiros.
            </p>
          </section>

          <section className="space-y-3 text-sm sm:text-base leading-relaxed text-bp-muted">
            <h2 className="font-head text-xl font-bold text-bp-text">
              5. Modificações dos Termos
            </h2>
            <p>
              Reservamo-nos o direito de alterar estes Termos a qualquer momento para adequação técnica ou legal. O uso contínuo da plataforma após alterações constitui aceitação dos novos termos.
            </p>
          </section>

          <div className="pt-4 border-t border-[#3d322e] flex justify-between items-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-bp-primary px-4 py-2 font-head text-xs font-bold text-bp-neutral transition hover:brightness-110 active:scale-95"
            >
              ← Voltar para o Início
            </Link>
            <Link
              href="/politica-de-privacidade"
              className="text-xs text-bp-muted hover:text-bp-primary transition underline"
            >
              Ver Política de Privacidade
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
