import Link from 'next/link'
import Nav from '../../components/Nav'
import Footer from '../../components/Footer'

export const metadata = {
  title: 'Política de Privacidade | BananaPrice',
  description: 'Política de privacidade e proteção de dados da plataforma BananaPrice.',
}

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="flex min-h-screen flex-col bg-bp-bg">
      <header className="sticky top-0 z-50 w-full shrink-0">
        <Nav logado />
      </header>

      <main className="flex-1 px-4 py-8 sm:px-8 sm:py-12 lg:px-16 max-w-4xl mx-auto w-full">
        <div className="rounded-3xl border-2 border-[#3d322e] bg-bp-surface p-6 sm:p-10 shadow-xl space-y-6">
          <div className="border-b border-[#3d322e] pb-4">
            <h1 className="font-head text-3xl sm:text-4xl font-extrabold text-bp-primary">
              Política de Privacidade
            </h1>
            <p className="mt-1 text-xs text-bp-muted/60">
              Última atualização: Novembro de 2026
            </p>
          </div>

          <section className="space-y-3 text-sm sm:text-base leading-relaxed text-bp-muted">
            <h2 className="font-head text-xl font-bold text-bp-text">
              1. Coleta de Informações
            </h2>
            <p>
              O BananaPrice preza pela sua privacidade e coleta apenas os dados essenciais para o funcionamento dos recursos da plataforma:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-bp-muted/90">
              <li><strong>Conta e Autenticação:</strong> Nome de usuário, e-mail e hash seguro da senha ao se cadastrar diretamente.</li>
              <li><strong>Integração com a Steam:</strong> Identificador público Steam ID e itens públicos da wishlist para sincronização automática de ofertas (sem acesso a senhas ou dados de pagamento da Steam).</li>
              <li><strong>Lista de Desejos e Notificações:</strong> Jogos salvos pelo usuário para fins de alerta de menor preço histórico.</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm sm:text-base leading-relaxed text-bp-muted">
            <h2 className="font-head text-xl font-bold text-bp-text">
              2. Uso dos Dados
            </h2>
            <p>
              Os dados coletados são utilizados exclusivamente para:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-bp-muted/90">
              <li>Autenticar o acesso do usuário à sua conta;</li>
              <li>Salvar jogos preferidos na Lista de Desejos;</li>
              <li>Disparar notificações no site e por e-mail quando jogos desejados atingirem novos descontos;</li>
              <li>Melhorar a experiência de navegação e histórico de buscas recentes (armazenado localmente no seu próprio navegador via <code className="text-bp-primary">localStorage</code>).</li>
            </ul>
          </section>

          <section className="space-y-3 text-sm sm:text-base leading-relaxed text-bp-muted">
            <h2 className="font-head text-xl font-bold text-bp-text">
              3. Compartilhamento e Terceiros
            </h2>
            <p>
              Não vendemos, alugamos ou comercializamos dados pessoais de usuários com anunciantes ou terceiros.
            </p>
            <p>
              Links que direcionam para lojas parceiras podem conter parâmetros de rastreamento de afiliados e identificadores seguros para viabilizar a manutenção e gratuidade da plataforma.
            </p>
          </section>

          <section className="space-y-3 text-sm sm:text-base leading-relaxed text-bp-muted">
            <h2 className="font-head text-xl font-bold text-bp-text">
              4. Seus Direitos (LGPD)
            </h2>
            <p>
              Conforme a Lei Geral de Proteção de Dados (LGPD), você possui o direito de solicitar a qualquer momento a visualização, alteração ou exclusão definitiva da sua conta e de todos os dados associados através da página de Conta ou entrando em contato com a equipe.
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
              href="/termos-de-uso"
              className="text-xs text-bp-muted hover:text-bp-primary transition underline"
            >
              Ver Termos de Uso
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
