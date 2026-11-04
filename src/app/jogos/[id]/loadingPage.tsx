import Loading from '@/components/loading'

export default function LoadingJogo() {
  return (
    <div className="flex min-h-[75vh] w-full items-center justify-center bg-bp-bg">
      <Loading mensagem="Carregando detalhes do jogo..." tamanho={200} />
    </div>
  )
}