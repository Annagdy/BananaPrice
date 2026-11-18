import { test, expect, type Page } from '@playwright/test'

// Troque por um título adulto que exista no seu banco (ou defina a variável de ambiente)
const JOGO_ADULTO = process.env.E2E_JOGO_ADULTO ?? 'Fear & Hunger'

const campoBusca = (page: Page) => page.getByRole('searchbox', { name: 'Buscar jogos' })
const cards = (page: Page) => page.locator('ul > li article')

async function buscar(page: Page, termo: string) {
  await campoBusca(page).fill(termo)
  await campoBusca(page).press('Enter')
  await expect(page).toHaveURL(new RegExp(`search=${encodeURIComponent(termo)}`))
}

test.describe('Busca e Filtros no BananaPrice', () => {
  test('TP-01: A busca nativa retorna os jogos correspondentes', async ({ page }) => {
    await page.goto('/jogos')
    await buscar(page, 'Stardew Valley')

    await expect(cards(page).first()).toBeVisible()
  })

  test('TP-03 / CT-01: Jogos adultos ocultos com filtro 18+ desligado', async ({ page, context, baseURL }) => {
    // Pré-condição: cookie bp_adulto ausente
    await page.goto('/jogos')
    await buscar(page, JOGO_ADULTO)
    await expect(page.getByText(JOGO_ADULTO)).toHaveCount(0)

    // O app lê o cookie `bp_adulto=1` (não "true")
    await context.addCookies([{ name: 'bp_adulto', value: '1', url: baseURL! }])
    await page.reload()

    await expect(page.getByText(JOGO_ADULTO).first()).toBeVisible()
  })

  test('TP-04 / CT-02: Filtros de estado, preço e loja se aplicam à busca', async ({ page }) => {
    // O parâmetro da URL é `search` (não `q`)
    await page.goto('/jogos?search=Zelda')
    await expect(cards(page).first()).toBeVisible()

    // Filtro "Grátis" é um chip com aria-pressed; os cards grátis mostram o texto "Grátis"
    const gratis = page.getByRole('button', { name: 'Grátis', exact: true })
    await gratis.click()
    await expect(gratis).toHaveAttribute('aria-pressed', 'true')
    for (const card of await cards(page).all()) {
      await expect(card).toContainText('Grátis')
    }

    // Não existe botão "Limpar": clicar de novo no chip desliga o filtro
    await gratis.click()
    await expect(gratis).toHaveAttribute('aria-pressed', 'false')

    // Grupo "Lojas" começa fechado e as lojas são chips (não checkboxes)
    await page.getByRole('button', { name: /Lojas/ }).click()
    const steam = page.getByRole('button', { name: 'Steam', exact: true })
    await steam.click()
    await expect(steam).toHaveAttribute('aria-pressed', 'true')
    await expect(cards(page).first()).toContainText('Steam')
  })

  test('CT-04: Exclusão padrão e filtro sob demanda de Consoles e Gift Cards', async ({ page }) => {
  await page.goto('/jogos')
  await buscar(page, 'Gift Card')

  const giftCards = cards(page).filter({ hasText: /gift card/i })

  // Por padrão, nenhum card de gift card/console aparece
  await expect(giftCards).toHaveCount(0)

  // Expande "Outros" e ativa o chip
  await page.getByRole('button', { name: /Outros/ }).click()
  await page.getByRole('button', { name: 'Consoles & Gift Cards' }).click()

  // Agora aparecem
  await expect(giftCards.first()).toBeVisible()
  })
})