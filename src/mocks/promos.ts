// Dados de exemplo da tela /jogos. Trocar pela API (/api/v1/games) quando estiver pronta.
export type Promo = {
  id: number
  name: string
  store: string
  original: number
  discount: number // em %
  price: number
  capa: string | null // URL da capa; null = usa a capa de exemplo (components/assets)
}

export const STORES = ['Nuuvem', 'GOG', 'EA Store', 'Epic Games Store', 'Steam']
export const PRICE_FILTERS = [5, 25, 50, 150]
export const CUT_FILTERS = [90, 75, 50, 25]
export const PER_PAGE = 12

const ORIGINALS = [30, 60, 100, 150, 200]
const DISCOUNTS = [25, 50, 75, 80, 90]

export const promos: Promo[] = Array.from({ length: 50 }, (_, i) => {
  const original = ORIGINALS[i % 5]
  const discount = DISCOUNTS[(i * 3 + 1) % 5]
  return {
    id: i + 1,
    name: 'Game Name',
    store: STORES[i % STORES.length],
    original,
    discount,
    price: Math.round(original * (1 - discount / 100) * 100) / 100,
    capa: null,
  }
})
