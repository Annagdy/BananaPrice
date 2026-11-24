/**
 * Padrões de expressões regulares que identificam itens que são Hardware,
 * Consoles ou Gift Cards / Moedas / Assinaturas (não sendo jogos em si).
 * | Regular expression patterns that identify items that are Hardware, Consoles or Gift Cards / Coins / Subscriptions (not games
 *   themselves).
 */
const PADROES_HARDWARE_GIFTCARD: RegExp[] = [
  // Gift cards e cartões de saldo / moedas virtuais / assinaturas de loja
  /\bgift\s*cards?\b/i,
  /\bcart(a|ã)o\s+presente\b/i,
  /\be?shop\s*cards?\b/i,
  /\bwallet\s*(cards?|top-?up|code)\b/i,
  /\bpsn\s*(cards?|voucher|code|plus)\b/i,
  /\bplaystation\s+store\s+card\b/i,
  /\bplaystation\s+network\s+card\b/i,
  /\bxbox\s+live\s*(gold)?\s*(cards?|code)?\b/i,
  /\bxbox\s+game\s*pass\b/i,
  /\bgame\s*pass\s+ultimate\b/i,
  /\b(nintendo|playstation|xbox|steam|razer|roblox|blizzard)\s+gift\b/i,
  /\broblox\s+(gift\s*card|robux)\b/i,

  // Consoles e hardware
  /\bconsoles?\b/i,
  /\bplaystation\s*5(\s+pro|\s+slim)?(\s+edition)?\b/i,
  /\bps5(\s+pro|\s+slim)?(\s+console)?\b/i,
  /\bplaystation\s*4(\s+pro|\s+slim)?(\s+console)?\b/i,
  /\bps4(\s+pro|\s+slim)?(\s+console)?\b/i,
  /\bxbox\s+series\s+[xs](\s+console)?\b/i,
  /\bxbox\s+one\s+[xs]?(\s+console)?\b/i,
  /\bnintendo\s+switch(\s+oled|\s+lite)?(\s+model|\s+console)?\b/i,
  /\bsteam\s+deck(\s+oled)?\b/i,
  /\bmeta\s+quest(\s+[23])?\b/i,
  /\boculus\s+quest\b/i,
  /\bdualsense(\s+wireless\s+controller)?\b/i,
  /\bjoy-?con\b/i,
]

/**
 * Verifica se o título de um item corresponde a um console, hardware ou cartão presente / gift card.
 * | Checks whether an item's title corresponds to a console, hardware or gift card.
 *
 * @param titulo Nome do jogo ou produto a ser verificado. | Name of the game or product to be checked.
 * @returns `true` se for classificado como console ou gift card; `false` se for jogo padrão.
 *   | `true` if classified as a console or gift card; `false` if it is a regular game.
 */
export function ehConsoleOuGiftCard(titulo: string | null | undefined): boolean {
  if (!titulo) return false
  const t = titulo.trim()
  return PADROES_HARDWARE_GIFTCARD.some((regex) => regex.test(t))
}
