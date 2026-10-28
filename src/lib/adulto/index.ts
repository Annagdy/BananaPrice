const COOKIE = "bp_adulto";

/* SERVIDOR: a pessoa escolheu ver conteúdo adulto? Lê o cookie da requisição. */
export function adultoPermitido(request: Request): boolean {
  const cookie = request.headers.get("cookie") ?? "";
  return new RegExp(`(?:^|;\\s*)${COOKIE}=1(?:;|$)`).test(cookie);
}

/* NAVEGADOR: lê a preferência. */
export function adultoAtivoNoNavegador(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").includes(`${COOKIE}=1`);
}

/* NAVEGADOR: liga ou desliga a preferência (cookie de 1 ano). */
export function definirAdultoNoNavegador(ativo: boolean): void {
  document.cookie = ativo
    ? `${COOKIE}=1; max-age=31536000; path=/; SameSite=Lax`
    : `${COOKIE}=; max-age=0; path=/; SameSite=Lax`;
}