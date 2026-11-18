import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import Nav from '../../components/Nav'

const CHAVE = 'bp_historico_buscas'

// Referências estáveis: se useSearchParams devolvesse um objeto novo a cada
// render, o useEffect do Nav (que depende dele) entraria em loop infinito.
const push = vi.fn()
const searchParams = new URLSearchParams()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => searchParams,
}))

// Evita o Supabase real (só é usado quando `logado` é true)
vi.mock('@/lib/supabase.ts/client', () => ({
  createClient: () => ({}),
}))

// next/image dentro do jsdom vira um <img> simples
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { priority, fill, ...rest } = props
    void priority
    void fill
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...(rest as React.ImgHTMLAttributes<HTMLImageElement>)} />
  },
}))

describe('CT-05: Buscas recentes salvas e bloqueio nativo', () => {
  beforeEach(() => {
    localStorage.clear()
    push.mockClear()
  })

  it('Não deve exibir o autocomplete nativo e deve salvar no localStorage', () => {
    render(<Nav />)

    const input = screen.getByRole('searchbox', { name: 'Buscar jogos' })

    // Bloqueio do autocomplete nativo do navegador
    expect(input).toHaveAttribute('autocomplete', 'off')

    // Simula uma busca. No jsdom, o Enter (keyDown) não dispara o submit do
    // formulário, então submetemos o form diretamente.
    fireEvent.change(input, { target: { value: 'Zelda' } })
    fireEvent.submit(screen.getByRole('search'))

    // Salvou no localStorage (chave real do componente) e navegou
    const salvo = JSON.parse(localStorage.getItem(CHAVE) || '[]')
    expect(salvo).toContain('Zelda')
    expect(push).toHaveBeenCalledWith('/jogos?search=Zelda&modo=nativa')

    // O termo aparece no dropdown de recentes ao focar
    fireEvent.focus(input)
    expect(screen.getByText('Zelda')).toBeInTheDocument()

    // Limpeza: o componente usa removeItem, então a chave deixa de existir
    fireEvent.click(screen.getByRole('button', { name: 'Limpar tudo' }))
    expect(localStorage.getItem(CHAVE)).toBeNull()
    expect(screen.queryByText('Zelda')).not.toBeInTheDocument()
  })
})