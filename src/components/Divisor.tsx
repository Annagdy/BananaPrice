// src/components/Divisor.tsx
import { tema } from '../mocks/tema'

type DivisorProps = {
  /** 'secao' para a linha espessa de cabeçalho (5px), 'fino' para divisões de formulário/cards */
  tipo?: 'secao' | 'fino'
  /** Cor personalizada em Hex ou RGBA (ex: '#3d322e', '#4a3a2a'). Se omitido, usa o padrão do tema. */
  cor?: string
  className?: string
}

/**
 * Componente de Linha Divisória estilizada de acordo com o design system do BananaPrice.
 *
 * @param props Tipo de divisor ('secao' espesso ou 'fino'), cor opcional e classes tailwind adicionais.
 * @returns Elemento JSX da linha divisória.
 */
export default function Divisor({ tipo = 'secao', cor, className = '' }: DivisorProps) {
  if (tipo === 'fino') {
    return (
      <div
        className={`w-full border-b ${!cor ? 'border-bp-muted/20' : ''} ${className}`}
        style={cor ? { borderColor: cor } : undefined}
      />
    )
  }

  return (
    <div
      className={`mx-2.5 h-[5px] rounded-[2px] ${className}`}
      style={{ background: cor || tema.divisorForte }}
    />
  )
}