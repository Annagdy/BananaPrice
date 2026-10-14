export type Game = {
  id: number
  name: string
  store: string
  discount: number
  originalPrice: number
  price: number
  cover: string | null
}

const stores = ['Steam', 'Epic Games', 'GOG', 'Nuuvem']

// Dados fake só para montar a tela. Depois troca pelos dados reais.
export const games: Game[] = Array.from({ length: 12 }, (_, i) => {
  const originalPrice = 99.9 + i * 10
  const discount = 40
  return {
    id: i + 1,
    name: `Game Name ${i + 1}`,
    store: stores[i % stores.length],
    discount,
    originalPrice,
    price: +(originalPrice * (1 - discount / 100)).toFixed(2),
    cover: null,
  }
})
